from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from core.models import Category, Group, StudentCandidate, StudentProfile

User = get_user_model()


class StudentRegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    group_name = serializers.CharField(max_length=50)          # имя группы строкой
    category_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False,
    )
    is_budget = serializers.BooleanField()
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже существует.')
        return value.lower()

    def validate(self, attrs):
        # 1. Группа должна существовать и быть активной
        try:
            group = Group.objects.get(name__iexact=attrs['group_name'])
        except Group.DoesNotExist:
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        # 2. Категории должны существовать
        categories = Category.objects.filter(id__in=attrs['category_ids'])
        if categories.count() != len(attrs['category_ids']):
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        # 3. Ищем заготовку: ФИО + группа + бюджетник + хотя бы одна категория
        candidates = StudentCandidate.objects.filter(
            full_name__iexact=attrs['full_name'].strip(),
            group=group,
            is_budget=attrs['is_budget'],
            is_registered=False,
            categories__in=categories,
        ).distinct()

        if not candidates.exists():
            # Одинаковый текст — защита от перебора (п. 3.1, 7.5)
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        attrs['_candidate'] = candidates.first()
        attrs['_group'] = group
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        candidate = validated_data['_candidate']

        # На случай гонки — перепроверяем, что заготовку ещё не заняли
        candidate = StudentCandidate.objects.select_for_update().get(pk=candidate.pk)
        if candidate.is_registered:
            raise serializers.ValidationError('К сожалению, вам питание не доступно.')

        # Создаём User
        user = User.objects.create_user(
            username=validated_data['email'],       # username = email, чтобы не плодить поля
            email=validated_data['email'],
            password=validated_data['password'],
            role=User.Role.STUDENT,
        )

        # Создаём профиль
        profile = StudentProfile.objects.create(
            user=user,
            candidate=candidate,
            full_name=candidate.full_name,
            group=candidate.group,
        )

        # Помечаем заготовку занятой
        candidate.is_registered = True
        candidate.save(update_fields=['is_registered'])

        return profile