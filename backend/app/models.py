from django.db import models
from django.contrib.auth.models import AbstractUser

# USER MODEL
class User(AbstractUser):
    full_name = models.CharField(max_length=255, blank=True)


# FEEDBACK MODEL
class Feedback(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    rating = models.IntegerField()
    comments = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# IMAGE TEST
class ImageQuestion(models.Model):
    target = models.CharField(max_length=100)

class ImageOption(models.Model):
    question = models.ForeignKey(ImageQuestion, on_delete=models.CASCADE, related_name="options")
    image = models.ImageField(upload_to="images/")
    is_correct = models.BooleanField(default=False)


class TestResult(models.Model):
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)