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
import zoneinfo

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

from django.db.models.functions import TruncDate
from django.db.models import Count
from datetime import date
import calendar

class QRStatsMonthView(APIView):
    permission_classes = [IsAuthenticated, IsStaffForQR]

    def get(self, request):
        # Получаем запрашиваемый месяц и год из GET-параметров (по умолчанию текущий)
        today = timezone.localdate()
        year = int(request.query_params.get('year', today.year))
        month = int(request.query_params.get('month', today.month))

        # Определяем первый и последний день месяца
        _, last_day = calendar.monthrange(year, month)
        start_date = date(year, month, 1)
        end_date = date(year, month, last_day)

        # Считаем выдачи в этом месяце, группируя по дням
        logs = (
            MealLog.objects
            .filter(issued_at__date__gte=start_date, issued_at__date__lte=end_date)
            .annotate(day=TruncDate('issued_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )

        # Формируем словарь: { '2026-11-01': 10, '2026-11-02': 15 ... }
        stats = {str(item['day']): item['count'] for item in logs}

        return Response({
            'year': year,
            'month': month,
            'stats': stats,
            'total_in_month': sum(stats.values())
        })

from core.models import StudentProfile, Group, StudentCandidate, Category
from rest_framework.permissions import IsAuthenticated
# ... (если каких-то импортов не хватает, добавь их сверху)

class AdminStudentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        data = []
        
        # 1. Профили (зарегистрированные)
        profiles = StudentProfile.objects.select_related('user', 'group', 'candidate').prefetch_related('candidate__categories')
        for p in profiles:
            # Берем ID категорий из заготовки
            cat_ids = [c.id for c in p.candidate.categories.all()]
            data.append({
                'id': f"profile_{p.id}",
                'full_name': p.full_name,
                'group': p.group.name,
                'email': p.user.email,
                'categories': cat_ids, # <--- Отдаем массив ID (например [2])
                'status_today': p.status_today,
                'registered_at': p.created_at,
                'is_registered': True,
            })

        # 2. Заготовки
        candidates = StudentCandidate.objects.filter(is_registered=False).select_related('group').prefetch_related('categories')
        for c in candidates:
            cat_ids = [cat.id for cat in c.categories.all()]
            data.append({
                'id': f"candidate_{c.id}",
                'full_name': c.full_name,
                'group': c.group.name,
                'email': '—',
                'categories': cat_ids, # <--- Отдаем массив ID
                'status_today': '—',
                'registered_at': c.created_at,
                'is_registered': False,
            })

        data.sort(key=lambda x: x['registered_at'], reverse=True)
        return Response(data)


class AdminResetStudentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        try:
            id_str = str(pk)
            if id_str.startswith('candidate_'):
                return Response({'detail': 'Нельзя сбросить заготовку'}, status=status.HTTP_400_BAD_REQUEST)
            
            real_id = int(id_str.split('_')[1])
            profile = StudentProfile.objects.get(pk=real_id)
            profile.status_today = 'not_issued'
            profile.token_used_today = False
            profile.current_qr_session = None
            profile.token_assigned_at = None
            profile.save()
            return Response({'detail': 'Попытка сброшена'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

from core.models import StudentProfile, Group, Category, User
# ...

from core.models import StudentProfile, Group, Category, User, StudentCandidate

class AdminStudentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        try:
            group, _ = Group.objects.get_or_create(name=data['group'])
            
            candidate = StudentCandidate.objects.create(
                full_name=data['fullName'],
                group=group,
                is_budget=True,
                is_registered=False
            )

            # Категории приходят как [1, 2]
            category_ids = data.get('categories', [])
            if category_ids:
                # Ищем категории строго по ID и привязываем
                cats = Category.objects.filter(id__in=category_ids)
                candidate.categories.set(cats)

            return Response({'id': f"candidate_{candidate.id}"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)



class AdminStudentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        try:
            id_str = str(pk)
            
            if id_str.startswith('profile_'):
                real_id = int(id_str.split('_')[1])
                profile = StudentProfile.objects.get(pk=real_id)
                group, _ = Group.objects.get_or_create(name=data['group'])
                
                profile.full_name = data['fullName']
                profile.group = group
                profile.save()
                
                # Обновляем категории у ЗАГОТОВКИ
                if data.get('categories') is not None:
                    cats = Category.objects.filter(id__in=data['categories'])
                    profile.candidate.categories.set(cats)

                if data.get('email') and data['email'] != '—':
                    profile.user.email = data['email']
                    profile.user.username = data['email']
                    profile.user.save()

            elif id_str.startswith('candidate_'):
                real_id = int(id_str.split('_')[1])
                candidate = StudentCandidate.objects.get(pk=real_id)
                group, _ = Group.objects.get_or_create(name=data['group'])
                
                candidate.full_name = data['fullName']
                candidate.group = group
                
                if data.get('categories') is not None:
                    cats = Category.objects.filter(id__in=data['categories'])
                    candidate.categories.set(cats)
                            
                candidate.save()

            return Response({'detail': 'Обновлено'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            id_str = str(pk)
            
            if id_str.startswith('profile_'):
                real_id = int(id_str.split('_')[1])
                profile = StudentProfile.objects.get(pk=real_id)
                profile.user.delete() # удалит и профиль
                
            elif id_str.startswith('candidate_'):
                real_id = int(id_str.split('_')[1])
                candidate = StudentCandidate.objects.get(pk=real_id)
                candidate.delete()
                
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)





from core.models import MealLog
from django.db.models import Count
import zoneinfo

class AdminMealLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        # Отдаем последние 1000 выдач для графиков (для MVP хватит)
        logs = MealLog.objects.select_related(
            'student', 'student__group', 'student__candidate'
        ).order_by('-issued_at')[:1000]

        data = []
        for log in logs:
            # Берем время в МСК
            local_time = log.issued_at.astimezone(zoneinfo.ZoneInfo("Asia/Vladivostok"))
            
            # Определяем категории (берем первую попавшуюся для простоты)
            cats = list(log.student.candidate.categories.values_list('name', flat=True))
            cat_name = cats[0] if cats else 'Нет'

            data.append({
                'id': log.id,
                'time': local_time.strftime('%H:%M'),
                'dateISO': local_time.strftime('%Y-%m-%d'),
                'monthKey': f'{local_time.year}-{local_time.month}',
                'fullName': log.student.full_name,
                'group': log.student.group.name,
                'category': cat_name,
            })
        return Response(data)

from core.models import Group

class AdminGroupListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        groups = Group.objects.all().order_by('name')
        data = [{
            'id': g.id,
            'number': g.name,
            'specialty': g.specialty,
            'studentsCount': g.students_count,
            'curator': g.curator,
            'status': 'study' if g.is_active else 'practice', # Мапим на фронт
        } for g in groups]
        return Response(data)

    def post(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        if Group.objects.filter(name=data['number']).exists():
            return Response({'detail': 'Группа с таким номером уже существует'}, status=status.HTTP_400_BAD_REQUEST)

        group = Group.objects.create(
            name=data['number'],
            specialty=data.get('specialty', ''),
            students_count=data.get('studentsCount', 0),
            curator=data.get('curator', ''),
            is_active=(data.get('status') == 'study')
        )
        return Response({'id': group.id}, status=status.HTTP_201_CREATED)


class AdminGroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            group = Group.objects.get(pk=pk)
            data = request.data
            
            group.name = data.get('number', group.name)
            group.specialty = data.get('specialty', group.specialty)
            group.students_count = data.get('studentsCount', group.students_count)
            group.curator = data.get('curator', group.curator)
            group.is_active = (data.get('status') == 'study')
            group.save()
            
            return Response({'detail': 'Обновлено'})
        except Group.DoesNotExist:
            return Response({'detail': 'Группа не найдена'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            group = Group.objects.get(pk=pk)
            group.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Group.DoesNotExist:
            return Response({'detail': 'Группа не найдена'}, status=status.HTTP_404_NOT_FOUND)

from core.models import Category
from django.db.models import Count

class AdminCategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        # Считаем количество студентов для каждой категории (через заготовки)
        categories = Category.objects.annotate(
            students_count=Count('candidates__profile')
        ).order_by('name')

        data = [{
            'id': c.id,
            'name': c.name,
            'count': c.students_count,
        } for c in categories]
        return Response(data)

    def post(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'detail': 'Название не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)
            
        if Category.objects.filter(name__iexact=name).exists():
            return Response({'detail': 'Такая категория уже существует'}, status=status.HTTP_400_BAD_REQUEST)

        category = Category.objects.create(name=name)
        return Response({'id': category.id, 'name': category.name, 'count': 0}, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            category = Category.objects.get(pk=pk)
            name = request.data.get('name', '').strip()
            
            if not name:
                return Response({'detail': 'Название не может быть пустым'}, status=status.HTTP_400_BAD_REQUEST)
                
            if Category.objects.filter(name__iexact=name).exclude(pk=pk).exists():
                return Response({'detail': 'Такая категория уже существует'}, status=status.HTTP_400_BAD_REQUEST)

            category.name = name
            category.save()
            return Response({'detail': 'Обновлено'})
        except Category.DoesNotExist:
            return Response({'detail': 'Категория не найдена'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            category = Category.objects.get(pk=pk)
            # Если к категории привязаны студенты, Django выдаст ошибку из-за PROTECT/M2M.
            # Мы обрабатываем это в except.
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Category.DoesNotExist:
            return Response({'detail': 'Категория не найдена'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': 'Нельзя удалить категорию, так как она привязана к студентам'}, status=status.HTTP_400_BAD_REQUEST)

from core.models import MealLog

class AdminMealLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['admin', 'moderator']:
            return Response({'detail': 'Доступ запрещён'}, status=status.HTTP_403_FORBIDDEN)

        logs = MealLog.objects.select_related(
            'student', 'student__group', 'student__candidate'
        ).order_by('-issued_at')[:1000]

        # Задаем часовой пояс Владивостока
        vlad_tz = zoneinfo.ZoneInfo("Asia/Vladivostok")

        data = []
        for log in logs:
            # Переводим время в UTC (как оно в базе), а затем во Владивосток
            vlad_time = log.issued_at.astimezone(vlad_tz)
            
            cats = list(log.student.candidate.categories.values_list('name', flat=True))
            cat_name = cats[0] if cats else 'Нет'

            data.append({
                'id': log.id,
                # Форматируем время и дату по Владивостоку
                'time': vlad_time.strftime('%H:%M'),
                'dateISO': vlad_time.strftime('%Y-%m-%d'),
                'monthKey': f'{vlad_time.year}-{vlad_time.month}',
                'fullName': log.student.full_name,
                'group': log.student.group.name,
                'category': cat_name,
            })
        return Response(data)