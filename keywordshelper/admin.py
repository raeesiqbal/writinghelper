from django.contrib import admin
from .models import *


class WebsiteAccessTabularInline(admin.TabularInline):
    model = WebsiteAccess


class WebsiteAccessAdmin(admin.ModelAdmin):
    list_display = ("id", "user_name", "website_name")

    def user_name(self, obj):
        return obj.user.username

    def website_name(self, obj):
        return obj.website.name

    search_fields = ["user__username", "website__name"]


class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email")
    search_fields = ["id", "username", "email"]
    inlines = [
        WebsiteAccessTabularInline,
    ]

    class Meta:
        model = User


class KeywordsGroupAdmin(admin.ModelAdmin):
    list_display = ("main_keyword", "website")
    search_fields = ["main_keyword", "website__name"]


class WebsiteAdmin(admin.ModelAdmin):
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        website = Website.objects.get(name=form.cleaned_data.get("name"))
        get_staffs = User.objects.filter(is_staff=True)
        for i in get_staffs:
            if not WebsiteAccess.objects.filter(website=website, user=i).exists():
                WebsiteAccess.objects.create(website=website, user=i)

    list_display = ("id", "name", "url")
    search_fields = ["id", "name", "url"]


class KeywordAdmin(admin.ModelAdmin):
    list_display = ("keyword", "group", "website_name")
    search_fields = ["keyword", "group__main_keyword", "group__website__name"]

    def website_name(self, obj):
        return obj.group.website.name


class ArticleAdmin(admin.ModelAdmin):
    list_display = ("url",)


# Register your models here.
admin.site.register(User, UserAdmin)
admin.site.register(KeywordsGroup, KeywordsGroupAdmin)
admin.site.register(Website, WebsiteAdmin)
admin.site.register(Keyword, KeywordAdmin)
admin.site.register(Article, ArticleAdmin)
admin.site.register(ArticleUpdate)
admin.site.register(WebsiteAccess, WebsiteAccessAdmin)
