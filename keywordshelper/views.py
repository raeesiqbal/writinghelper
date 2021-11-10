from django.contrib.auth.models import Group
import keywordshelper
from django.shortcuts import render
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import datetime
import json
from .models import *


def index(request):
    if request.user.is_authenticated:
        get_websites = WebsiteAccess.objects.filter(user=request.user).order_by(
            "-timestamp"
        )
        return render(request, "keywordshelper/index2.html", {"websites": get_websites})
    return HttpResponseRedirect(reverse("login"))


def login_view(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse("index"))
    elif request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user != None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        return render(
            request,
            "keywordshelper/login2.html",
            {"message": "invalid username/password"},
        )
    return render(request, "keywordshelper/login2.html")


@login_required
def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


@login_required
def register_view(request):
    # can't register users if not the admin
    if not request.user.is_superuser:
        return HttpResponseRedirect(reverse("index"))
    # if the request is post, this means that the form is filled.
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()
        except IntegrityError:
            return render(
                request,
                "keywordshelper/register2.html",
                {"message": "Username is already taken", "message_type": "danger"},
            )
        # redirected to the login page when
        return render(
            request,
            "keywordshelper/register2.html",
            {"message": "account successfully created", "message_type": "success"},
        )
    # if it is a get request, the register page will open
    return render(request, "keywordshelper/register2.html")


@login_required
@csrf_exempt
def get_keywords(request):
    if request.method == "PUT":
        data = json.loads(request.body)
        if Website.objects.filter(id=data["website"]).exists():
            get_website = Website.objects.get(id=data["website"])
            get_groups = KeywordsGroup.objects.filter(website=get_website)
            dict = {}
            if request.user.is_staff:
                if data["search_type"] == "partial search":
                    for i in get_groups:
                        check = 0
                        gett = Keyword.objects.filter(group=i)
                        for ii in gett:
                            if check == 0:
                                if data["keyword"] in ii.keyword.lower():
                                    dict[i.main_keyword] = []
                                    check = 1
                                    for iii in gett:
                                        dict[i.main_keyword].append(iii.keyword)
                    return JsonResponse(dict, safe=False)
                if data["search_type"] == "exact search":
                    for i in get_groups:
                        check = 0
                        gett = Keyword.objects.filter(group=i)
                        for ii in gett:
                            if data["keyword"] in ii.keyword.lower():
                                if check is not 1:
                                    dict[i.main_keyword] = []
                                    check = 1
                                dict[i.main_keyword].append(ii.keyword)
                    return JsonResponse(dict, safe=False)
            else:
                if data["search_type"] == "partial search":
                    keywords = []
                    list = []
                    for i in get_groups:
                        get = Keyword.objects.filter(group=i)
                        for i in get:
                            keywords.append(i)
                    for i in keywords:
                        if data["keyword"] in i.keyword.lower():
                            if not i.group.main_keyword in dict.keys():
                                dict[i.group.main_keyword] = []
                    print("dasdasd", dict)
                    return JsonResponse(dict, safe=False)
        else:
            return JsonResponse({"error": "website not exists"})


@login_required
@csrf_exempt
def get_related_articles(request):

    body = json.loads(request.body.decode("utf-8"))
    headings = body["data"]
    website = body["website"]
    included_articles_urls = []

    for article in (
        Website.objects.get(name=website).article.all().values("text", "url")
    ):
        article["text"] = article["text"].lower()
        for heading in headings:
            found = False
            for index, heading_subset in enumerate(heading):
                heading_subset = heading_subset.lower()
                if heading_subset in article["text"]:
                    found = True
                    included_articles_urls.append(
                        {"link": article["url"], "keyword": heading_subset}
                    )
                    break
            if found:
                break

    return JsonResponse(included_articles_urls, safe=False)


@login_required
def update_cache(request):

    if request.user.is_superuser:
        database_connections.update_all_articles()
        return JsonResponse({"message": "success"})

    return JsonResponse({"message": "error"})


@login_required
def upload_keywords(request):
    websites_names = [
        website["name"] for website in Website.objects.all().values("name")
    ]
    if request.user.is_superuser:
        if request.method == "POST":
            variations = request.POST["sub_keywords"]
            main_keyword = request.POST["main_keyword"]
            website = request.POST["website"]
            variations = [i.strip() for i in variations.split(",") if i.strip()]
            website_object = Website.objects.get(name=website)
            if main_keyword in [
                keyword_group["main_keyword"]
                for keyword_group in KeywordsGroup.objects.filter(
                    website=website_object
                ).values("main_keyword")
            ]:
                return render(
                    request,
                    "keywordshelper/upload_keywords2.html",
                    {
                        "websites": websites_names,
                        "message": f"keyword group already present: {main_keyword}",
                    },
                )
            check = 0
            for variation in variations:
                if Keyword.objects.filter(keyword=variation).exists():
                    check = 1
                    return render(
                        request,
                        "keywordshelper/upload_keywords2.html",
                        {
                            "websites": websites_names,
                            "message": f"Keyword already present: {variation}",
                        },
                    )
            group = KeywordsGroup.objects.create(
                main_keyword=main_keyword, website=website_object
            )
            group.save()
            for variation in variations:
                Keyword.objects.create(keyword=variation, group=group).save()
            return render(
                request,
                "keywordshelper/upload_keywords2.html",
                {"websites": websites_names, "message": "success"},
            )
        return render(
            request,
            "keywordshelper/upload_keywords2.html",
            {"websites": websites_names, "message": ""},
        )
    return HttpResponseRedirect(reverse("index"))
