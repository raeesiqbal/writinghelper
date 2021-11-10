from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("create_user", views.register_view, name="create_user"),
    path("upload_keywords", views.upload_keywords, name="upload_keywords"),
    # apis
    path(
        "get_keywords/",
        views.get_keywords,
        name="get_keywords",
    ),
    path(
        "get_related_articles", views.get_related_articles, name="get_related_articles"
    ),
    path("update_cache", views.update_cache, name="update_cache"),
]
