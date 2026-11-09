from django.shortcuts import render
from .serializers import (
    QRSessionCreateSerializer, QRSessionSerializer, QRScanSerializer,
)
from .serializers import (
    QRSessionCreateSerializer, QRSessionSerializer, QRScanSerializer,
    MealConfirmSerializer,
)
from .reports import get_report_data
import openpyxl
from django.http import HttpResponse
from openpyxl.styles import Font, Alignment
import openpyxl
from django.db import transaction
from core.models import Group, Category, StudentCandidate
# Create your views here.
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import MealLog, QRSession
from .permissions import IsStaffForQR
from .serializers import QRSessionCreateSerializer, QRSessionSerializer


def today_issued_count() -> int:
    """Сколько порций выдано сегодня."""
    today = timezone.localdate()
    return MealLog.objects.filter(issued_at__date=today).count()


class QRSessionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsStaffForQR]

    def post(self, request):
        serializer = QRSessionCreateSerializer(
            data={}, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        session = serializer.save()

        return Response(
            {
                **QRSessionSerializer(session).data,
                'issued_today': today_issued_count(),
            },
            status=status.HTTP_201_CREATED,
        )


class TodayStatsView(APIView):
    """Счётчик для автообновления на планшете."""
    permission_classes = [IsAuthenticated, IsStaffForQR]

    def get(self, request):
        return Response({
            'issued_today': today_issued_count(),
            'server_time': timezone.now(),
        })
from rest_framework.permissions import IsAuthenticated as _IsAuth  # уже есть, не дублируй


class QRScanView(APIView):
    """Сканирование QR студентом."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = QRScanSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = serializer.save()

        return Response({
            'detail': 'Подтвердите получение питания.',
            'student': {
                'full_name': profile.full_name,
                'group': profile.group.name,
            },
        })
class MealConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MealConfirmSerializer(data={}, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        profile = serializer.save()

        return Response({
            'detail': 'Поздравляем, Вы получили еду.',
            'student': {
                'full_name': profile.full_name,
                'group': profile.group.name,
            },
        })

class StudentStatusView(APIView):
    """Статус питания на сегодня для главного экрана студента."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.student_profile
        except Exception:
            return Response(
                {'detail': 'Профиль студента не найден.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'status_today': profile.status_today,   # 'not_issued' / 'issued'
            'can_scan': (
                profile.status_today == 'not_issued'
                and not profile.token_used_today
                and profile.group.is_active
            ),
            'full_name': profile.full_name,
            'group': profile.group.name,
        })
class StudentUploadView(APIView):
    permission_classes = [IsAuthenticated, IsStaffForQR]  # Только сотрудники (модератор/админ)

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Файл не передан.'}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.endswith('.xlsx'):
            return Response({'detail': 'Поддерживается только формат .xlsx'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wb = openpyxl.load_workbook(file, data_only=True)
            sheet = wb.active
        except Exception as e:
            return Response({'detail': f'Ошибка чтения файла: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        errors = []

        # Пропускаем первую строку (заголовки)
        for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            if not row or not row[0]:
                continue  # Пустая строка

            full_name = str(row[0]).strip()
            group_name = str(row[1]).strip()
            is_budget_raw = str(row[2]).strip().lower() if len(row) > 2 else ''
            categories_raw = str(row[3]).strip() if len(row) > 3 else ''

            # Парсим бюджетника
            is_budget = is_budget_raw in ['да', 'true', '1', 'yes']

            if not full_name or not group_name:
                errors.append(f'Строка {row_idx}: пустое ФИО или группа.')
                continue

            try:
                with transaction.atomic():
                    # 1. Группа (создаём, если нет)
                    group, _ = Group.objects.get_or_create(name=group_name)

                    # 2. Категории
                    cat_names = [c.strip() for c in categories_raw.split(',') if c.strip()]
                    categories = []
                    for cname in cat_names:
                        cat, _ = Category.objects.get_or_create(name=cname)
                        categories.append(cat)

                    # 3. Создаём заготовку
                    candidate = StudentCandidate.objects.create(
                        full_name=full_name,
                        group=group,
                        is_budget=is_budget,
                    )
                    if categories:
                        candidate.categories.set(categories)

                    created_count += 1
            except Exception as e:
                errors.append(f'Строка {row_idx}: {str(e)}')

        return Response({
            'detail': f'Успешно загружено: {created_count}',
            'errors': errors,
        }, status=status.HTTP_200_OK)

class ReportSummaryView(APIView):
    """JSON-отчёт для админки."""
    permission_classes = [IsAuthenticated, IsStaffForQR]  # Только для сотрудников

    def get(self, request):
        # Проверка, что это админ или модератор
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён.'}, status=status.HTTP_403_FORBIDDEN)

        data = get_report_data(request)
        return Response(data)


class ReportExportView(APIView):
    """Выгрузка отчёта в Excel (ТЗ п.6.3)."""
    permission_classes = [IsAuthenticated, IsStaffForQR]

    def get(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён.'}, status=status.HTTP_403_FORBIDDEN)

        data = get_report_data(request)

        # Генерируем Excel
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Отчёт по питанию"

        # Заголовки
        ws['A1'] = f"Отчёт за период с {data['period']['from']} по {data['period']['to']}"
        ws['A1'].font = Font(bold=True, size=14)
        ws.merge_cells('A1:D1')
        ws['A1'].alignment = Alignment(horizontal='center')

        # Блок метрик
        ws['A3'] = "Всего выдано порций:"
        ws['B3'] = data['metrics']['total_issued']
        
        ws['A4'] = "Уникальных студентов:"
        ws['B4'] = data['metrics']['unique_students']
        
        ws['A5'] = "Успешных попыток:"
        ws['B5'] = data['metrics']['success_attempts']
        
        ws['A6'] = "Неуспешных попыток:"
        ws['B6'] = data['metrics']['fail_attempts']

        # Блок по группам
        ws['A8'] = "Группа"
        ws['B8'] = "Выдано порций"
        ws['A8'].font = Font(bold=True)
        ws['B8'].font = Font(bold=True)

        row = 9
        for g in data['by_group']:
            ws[f'A{row}'] = g['student__group__name']
            ws[f'B{row}'] = g['count']
            row += 1

        # Настраиваем ширину колонок
        ws.column_dimensions['A'].width = 30
        ws.column_dimensions['B'].width = 20

        # Отдаём файл
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="report.xlsx"'
        wb.save(response)
        return response