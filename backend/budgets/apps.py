from django.apps import AppConfig


class BudgetsConfig(AppConfig):
    name = 'budgets'

    def ready(self):
        import budgets.signals
