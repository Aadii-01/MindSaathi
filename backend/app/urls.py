from django.urls import path
from .views import (
    register, login, admin_login, get_all_users,
    submit_feedback, get_all_feedback,
    captcha_challenge, captcha_verify,
    save_result, get_results, get_my_results,
    get_my_profile,
    health_check
)

urlpatterns = [
    # Auth
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('admin-login/', admin_login, name='admin_login'),
    path('users/', get_all_users, name='users'),

    # Feedback
    path('feedback/', submit_feedback, name='feedback'),
    path('feedback/all/', get_all_feedback, name='feedback_all'),

    # CAPTCHA Image Test
    path('captcha/challenge/', captcha_challenge, name='captcha_challenge'),
    path('captcha/verify/', captcha_verify, name='captcha_verify'),

    # Results
    path('result/', save_result, name='save_result'),
    path('results/', get_results, name='get_results'),
    path('results/me/', get_my_results, name='get_my_results'),
    path('profile/me/', get_my_profile, name='get_my_profile'),



    # Health
    path('health/', health_check, name='health'),
]

