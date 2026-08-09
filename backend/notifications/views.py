from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch', 'post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        instance = self.get_object()
        instance.is_read = True
        instance.save()
        return Response({"detail": "Notification marked as read."}, status=status.HTTP_200_OK)
