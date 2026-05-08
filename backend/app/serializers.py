from rest_framework import serializers
from .models import User, Feedback, ImageQuestion

# REGISTER
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


# LOGIN
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


# FEEDBACK
class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'


# IMAGE TEST
class ImageQuestionSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    correct = serializers.SerializerMethodField()

    class Meta:
        model = ImageQuestion
        fields = ['target', 'images', 'correct']

    def get_images(self, obj):
        return [opt.image.url for opt in obj.options.all()]

    def get_correct(self, obj):
        return [i for i, opt in enumerate(obj.options.all()) if opt.is_correct]