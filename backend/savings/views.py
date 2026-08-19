from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import SavingsGoal
from .serializers import SavingsGoalSerializer


class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        user = request.user
        if getattr(user, 'role', 'student') == 'student':
            active_goals_count = SavingsGoal.objects.filter(user=user).count()
            if active_goals_count >= 2:
                return Response(
                    {"detail": "Student accounts are limited to a maximum of 2 active savings goals. Upgrade to Premium for unlimited goals."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
