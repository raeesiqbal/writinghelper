from django.db import models
from django.contrib.auth.models import AbstractUser
from django import forms


class Website(models.Model):
    name = models.CharField(max_length=64, unique=True)
    url = models.URLField(unique=True)
    database_name = models.CharField(max_length=32)
    database_prefix = models.CharField(max_length=32)
    timestamp = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    pass

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        super(User, self).save(*args, **kwargs)
        user = User.objects.get(username=self.username)
        get_websites = WebsiteAccess.objects.filter(user=user)
        print(get_websites)
        if self.is_staff and not WebsiteAccess.objects.filter(user=user).exists():
            for i in Website.objects.all():
                WebsiteAccess.objects.create(website=i, user=user)
        super(User, self).save(*args, **kwargs)


class WebsiteAccess(models.Model):
    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="website_access"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="website_access",
        null=True,
        blank=True,
    )
    timestamp = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return self.user.username


class KeywordsGroup(models.Model):
    main_keyword = models.CharField(max_length=80, unique=True)
    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="keywords_group"
    )

    def __str__(self):
        return self.main_keyword

    def serialize(self):
        return {
            "id": self.id,
            "keyword": self.main_keyword,
        }


class Keyword(models.Model):
    keyword = models.CharField(max_length=64)
    group = models.ForeignKey(
        KeywordsGroup, on_delete=models.CASCADE, related_name="variation"
    )

    def __str__(self):
        return self.keyword

    def serialize(self):
        return {
            "id": self.id,
            "keyword": self.keyword,
            "group": self.group.main_keyword,
        }


class ArticleUpdate(models.Model):
    update_date = models.DateField(auto_now_add=True)


class Article(models.Model):
    text = models.TextField()
    url = models.URLField(unique=True)
    website = models.ForeignKey(
        Website, on_delete=models.CASCADE, related_name="article"
    )
    add_date = models.ForeignKey(
        ArticleUpdate, on_delete=models.CASCADE, related_name="article"
    )

    def __str__(self):
        return self.url
