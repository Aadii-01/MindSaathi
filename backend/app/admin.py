from django.contrib import admin
from .models import User, Feedback, ImageQuestion, ImageOption

class ImageOptionInline(admin.TabularInline):
    model = ImageOption
    extra = 9

@admin.register(ImageQuestion)
class ImageQuestionAdmin(admin.ModelAdmin):
    inlines = [ImageOptionInline]

admin.site.register(User)
admin.site.register(Feedback)


# admin@gmail.com, awdx1234