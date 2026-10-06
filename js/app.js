(function () {
  ("use strict");

  var ROUTES = [
    "home",
    "publish",
    "mine",
    "search",
    "detail",
    "myLost",
    "myFound",
    "favorites",
    "profile",
    "publishSuccess",
    "publishFailure",
  ];

  var LEGACY_ALIASES = {
    发布成功: "publishSuccess",
    发布失败: "publishFailure",
    "edit-profile": "profile",
    "my-lost": "myLost",
    "my-found": "myFound",
    "my-favorites": "favorites",
  };

  var detailFavorite = false;
  var searchCategory = "全部";
  var homeCategory = "全部";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector)
    );
  }

  function getView(name) {
    return document.getElementById("view-" + name);
  }

  function activeView() {
    return document.querySelector(".view.active");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseHash() {
    var raw = (window.location.hash || "").replace(/^#\/?/, "");
    if (!raw) {
      return { name: "home", param: null };
    }

    if (LEGACY_ALIASES[raw]) {
      raw = LEGACY_ALIASES[raw];
    }

    if (raw.indexOf("detail/") === 0) {
      return { name: "detail", param: raw.slice(7) || "item1" };
    }

    if (ROUTES.indexOf(raw) === -1) {
      return { name: "home", param: null };
    }

    return { name: raw, param: null };
  }

  function updateNav(routeName) {
    var target = null;
    if (routeName === "home") {
      target = "首页";
    } else if (
      routeName === "publish" ||
      routeName === "publishSuccess" ||
      routeName === "publishFailure"
    ) {
      target = "发布";
    } else if (
      routeName === "mine" ||
      routeName === "myLost" ||
      routeName === "myFound"
    ) {
      target = "我的";
    }

    $$(".nav-btn").forEach(function (btn) {
      var spans = btn.querySelectorAll("span");
      var label = spans.length ? spans[spans.length - 1].innerText.trim() : "";
      btn.classList.toggle("active", target !== null && label === target);
    });
  }

  function getDetailItem(id) {
    var data = window.APP_DATA || {};
    var item = data.itemsById && data.itemsById[id];
    if (!item && data.items && data.items.length) {
      item = data.items[0];
    }
    return (
      item || {
        type: "lost",
        category: "校园卡",
        image: "images/campus-card.jpg",
        title: "蓝色校园卡",
        location: "图书馆三楼",
        time: "2026-09-28 14:30",
        desc: "暂无描述",
        publisher: "同学",
        contact: "暂无联系方式",
        wechat: "暂无微信",
      }
    );
  }

  function renderDetail(id) {
    var view = getView("detail");
    if (!view) return;

    var item = getDetailItem(id);
    var isFound = item.type === "found";

    var image = $(".detail-image", view);
    var status = $(".status-tag", view);
    var typeTag = $(".type-tag", view);
    var title = $(".detail-title", view);
    var infoValues = $$(".info-row .info-value", view);
    var description = $(".description", view);
    var publisherName = $(".publisher-name", view);
    var publisherTime = $(".publisher-time", view);
    var contactBtn = $(".contact-btn", view);
    var contactRows = $$("#contactModal .contact-row", view);
    var favoriteBtn = $("#favoriteBtn", view);
    var favoriteIcon = $("#favoriteIcon", view);
    var favoriteText = $("#favoriteText", view);

    if (image) {
      image.innerHTML =
        '<img class="item-image-real" src="' +
        item.image +
        '" alt="' +
        item.title +
        '">';
    }
    if (status) {
      status.textContent = isFound ? "招领" : "寻物";
      status.classList.toggle("found", isFound);
    }
    if (typeTag) typeTag.textContent = item.category;
    if (title) title.textContent = item.title;
    if (infoValues[0]) infoValues[0].textContent = item.time;
    if (infoValues[1]) infoValues[1].textContent = item.location;
    if (infoValues[2]) infoValues[2].textContent = item.category;
    if (description)
      description.innerHTML = escapeHtml(item.desc).replace(/\n/g, "<br>");
    if (publisherName) publisherName.textContent = item.publisher;
    if (publisherTime) publisherTime.textContent = "发布于 " + item.time;
    if (contactBtn)
      contactBtn.textContent = isFound ? "联系招领者" : "联系寻物者";
    if (contactRows[0])
      contactRows[0].textContent = "📱　联系方式：" + item.contact;
    if (contactRows[1]) contactRows[1].textContent = "💬　微信：" + item.wechat;

    detailFavorite = false;
    if (favoriteBtn) favoriteBtn.classList.remove("active");
    if (favoriteIcon) favoriteIcon.innerText = "♡";
    if (favoriteText) favoriteText.innerText = "收藏";
  }

  function renderHomeList() {
    var lostList = $("#homeLostList");
    var foundList = $("#homeFoundList");
    if (!lostList && !foundList) return;

    var store = window.LostFoundStore;
    if (!store || typeof store.getItems !== "function") {
      if (lostList) lostList.innerHTML = "";
      if (foundList) foundList.innerHTML = "";
      return;
    }

    var activeStatus = store.STATUSES ? store.STATUSES.ACTIVE : "进行中";
    var filters = { status: activeStatus };
    if (homeCategory && homeCategory !== "全部") {
      filters.category = homeCategory;
    }
    var items = store.filterItems(store.getItems(), filters);

    items.sort(function (a, b) {
      var timeA = a.time || a.createdAt || "";
      var timeB = b.time || b.createdAt || "";
      if (timeA === timeB) return 0;
      return timeA > timeB ? -1 : 1;
    });

    var lostItems = items.filter(function (item) {
      return item.type !== "招领";
    });
    var foundItems = items.filter(function (item) {
      return item.type === "招领";
    });

    if (lostList) {
      lostList.innerHTML = lostItems.map(homeCardHtml).join("");
    }
    if (foundList) {
      foundList.innerHTML = foundItems.map(homeCardHtml).join("");
    }
  }

  function homeCardHtml(item) {
    var id = escapeHtml(item.id);
    var typeClass = item.type === "招领" ? "found" : "lost";
    var typeLabel = escapeHtml(item.type === "招领" ? "招领" : "寻物");
    var category = escapeHtml(item.category);
    var name = escapeHtml(item.name);
    var time = escapeHtml(item.time);
    var location = escapeHtml(item.location);
    var image = item.image || homeCategoryImage(item.category);

    return (
      '<div class="list-item" onclick="goToDetail(\'' +
      id +
      "')\">" +
      '<div class="item-image-placeholder">' +
      '<img class="item-image-real" src="' +
      image +
      '" alt="' +
      name +
      '">' +
      '<span class="item-image-name">' +
      name +
      "</span>" +
      "</div>" +
      '<div class="item-content">' +
      '<div class="row-first">' +
      '<span class="tag-status ' +
      typeClass +
      '">' +
      typeLabel +
      "</span>" +
      '<span class="tag-item-type">' +
      category +
      "</span>" +
      "</div>" +
      '<div class="item-name">' +
      name +
      "</div>" +
      '<div class="row-time">📅 ' +
      time +
      "</div>" +
      '<div class="row-location">📍 ' +
      location +
      "</div>" +
      '<div class="detail-link">&gt; 查看详情</div>' +
      "</div>" +
      "</div>"
    );
  }

  function homeCategoryImage(category) {
    var map = {
      校园卡: "images/campus-card.jpg",
      钥匙: "images/keys.jpg",
      水杯: "images/water-bottle.jpg",
      雨伞: "images/umbrella.jpg",
      耳机: "images/earphones.jpg",
      书籍: "images/books.jpg",
      其他: "images/backpack.jpg",
    };
    return map[category] || "images/backpack.jpg";
  }

  window.filterHomeCategory = function (category, button) {
    homeCategory = category || "全部";
    var view = getView("home");

    $$(".home-filter", view).forEach(function (item) {
      item.classList.remove("active");
    });
    if (button) {
      button.classList.add("active");
    }

    renderHomeList();
  };

  function renderRoute() {
    var route = parseHash();
    var view = getView(route.name) || getView("home");

    $$(".view").forEach(function (v) {
      v.classList.remove("active");
    });
    view.classList.add("active");
    updateNav(route.name);

    if (route.name === "home") {
      renderHomeList();
    } else if (route.name === "search") {
      renderSearchResults(false);
    } else if (route.name === "detail") {
      renderDetail(route.param || "item1");
    } else if (route.name === "myLost") {
      renderMyLostList();
    } else if (route.name === "myFound") {
      renderMyFoundList();
    } else if (route.name === "mine") {
      loadMineProfile();
    } else if (route.name === "profile") {
      loadProfile();
    }

    window.scrollTo(0, 0);
  }

  // ===== 路由跳转 =====
  window.goToDetail = function (id) {
    window.location.hash = "detail/" + id;
  };

  window.goToSearch = function () {
    window.location.hash = "search";
  };

  window.goHome = function () {
    window.location.hash = "home";
  };

  window.goPublish = function () {
    window.location.hash = "publish";
  };

  window.goMine = function () {
    window.location.hash = "mine";
  };

  window.openDetail = function (id) {
    window.location.hash = "detail/" + id;
  };

  window.goToEditProfile = function () {
    window.location.hash = "profile";
  };

  window.goToMyLost = function () {
    window.location.hash = "myLost";
  };

  window.goToMyFound = function () {
    window.location.hash = "myFound";
  };

  window.goToMyFavorites = function () {
    window.location.hash = "favorites";
  };

  window.goToSettings = function () {
    window.alert("设置功能暂未开放");
  };

  window.goBack = function () {
    var view = activeView();
    var route = view ? view.getAttribute("data-route") : "home";
    if (route === "detail") {
      window.location.hash = "search";
    } else {
      window.location.hash = "mine";
    }
  };

  // ===== 发布页 =====
  window.selectType = function (type) {
    var view = getView("publish");
    if (!view) return;

    var lostBtn = $("#lostBtn", view);
    var foundBtn = $("#foundBtn", view);
    var formCard = $("#formCard", view);
    var publishContent = $("#publishContent", view);
    var typeText = $("#typeText", view);
    var placeLabel = $("#placeLabel", view);
    var timeLabel = $("#timeLabel", view);

    if (type === "found") {
      lostBtn.classList.remove("active");
      foundBtn.classList.add("active");
      formCard.classList.add("found");
      publishContent.classList.add("found-mode");
      publishContent.classList.remove("lost-mode");
      typeText.innerText = "正在发布招领信息";
      placeLabel.innerHTML = '<span class="required">*</span> 得到地点';
      timeLabel.innerHTML = '<span class="required">*</span> 得到时间';
    } else {
      lostBtn.classList.add("active");
      foundBtn.classList.remove("active");
      formCard.classList.remove("found");
      publishContent.classList.add("lost-mode");
      publishContent.classList.remove("found-mode");
      typeText.innerText = "正在发布寻物信息";
      placeLabel.innerHTML = '<span class="required">*</span> 丢失地点';
      timeLabel.innerHTML = '<span class="required">*</span> 丢失时间';
    }
  };

  window.previewImages = function (event) {
    var view = event.target.closest(".view");
    if (!view) return;

    var files = event.target.files;
    var preview = $("#imagePreview", view);
    preview.innerHTML = "";

    if (!files || files.length === 0) {
      preview.classList.remove("show");
      return;
    }

    Array.prototype.slice.call(files, 0, 4).forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = document.createElement("img");
        img.src = e.target.result;
        img.className = "preview-item";
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
    preview.classList.add("show");
  };

  // ===== 发布信息保存 =====
  window.publishInfo = function () {
    var view = getView("publish");
    if (!view) return;

    // ===== 获取表单元素 =====
    var itemType = $("#itemType", view);
    var itemName = $("#itemName", view);
    var place = $("#placeInput", view);
    var date = $("#dateInput", view);
    var time = $("#timeInput", view);
    var contact = $("#contactInput", view);
    var description = $("textarea", view);
    var imageInput = $("#imageInput", view);

    // ===== 检查必填项 =====
    var valid =
      itemType &&
      itemType.value &&
      itemName &&
      itemName.value.trim() &&
      place &&
      place.value.trim() &&
      date &&
      date.value &&
      time &&
      time.value &&
      contact &&
      contact.value.trim();

    if (!valid) {
      window.location.hash = "publishFailure";
      return;
    }

    // ===== 检查数据存储模块 =====
    var store = window.LostFoundStore;

    if (!store || typeof store.addItem !== "function") {
      console.error("LostFoundStore.addItem 不存在");
      window.location.hash = "publishFailure";
      return;
    }

    // ===== 判断发布类型 =====
    // publishContent 当前会根据 selectType() 添加：
    // lost-mode / found-mode
    var type = view.classList.contains("found-mode") ? "招领" : "寻物";

    // ===== 基础数据 =====
    var newItem = {
      type: type,
      name: itemName.value.trim(),
      category: itemType.value,
      location: place.value.trim(),
      time: date.value + " " + time.value,
      description: description ? description.value.trim() : "",
      contact: contact.value.trim(),

      // 新发布的信息默认处于进行中
      status: "进行中",
    };

    // ===== 图片处理 =====
    // data.js 当前的数据结构只有一个 image 字段，
    // 所以这里保存用户选择的第一张图片。
    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      var file = imageInput.files[0];

      var reader = new FileReader();

      reader.onload = function (event) {
        newItem.image = event.target.result;

        savePublishedItem(newItem);
      };

      reader.onerror = function () {
        // 图片读取失败时仍然允许发布，只是不保存图片
        savePublishedItem(newItem);
      };

      reader.readAsDataURL(file);
    } else {
      // 没有上传图片，直接保存
      savePublishedItem(newItem);
    }

    // ===== 真正保存数据 =====
    function savePublishedItem(item) {
      try {
        var createdItem = store.addItem(item);

        // addItem 失败
        if (!createdItem) {
          window.location.hash = "publishFailure";
          return;
        }

        // 保存最近一次发布的信息
        // 后面的“发布成功”页面或者“我的”页面可以继续使用
        try {
          sessionStorage.setItem(
            "lastPublishedItem",
            JSON.stringify(createdItem)
          );
        } catch (e) {
          console.warn("无法保存 lastPublishedItem:", e);
        }

        // ===== 发布成功 =====
        window.location.hash = "publishSuccess";
      } catch (error) {
        console.error("发布信息失败:", error);
        window.location.hash = "publishFailure";
      }
    }
  };

  // ===== 我的寻物 / 我的招领 =====
  // ======================================================
  // 我的寻物 / 我的招领
  // ======================================================

  var myListFilter = {
    myLost: "all",
    myFound: "all",
  };

  // 根据类别获取默认图片
  function getItemImage(category) {
    var map = {
      校园卡: "images/campus-card.jpg",
      钥匙: "images/keys.jpg",
      水杯: "images/water-bottle.jpg",
      雨伞: "images/umbrella.jpg",
      耳机: "images/earphones.jpg",
      书籍: "images/books.jpg",
      其他: "images/backpack.jpg",
    };

    return map[category] || "images/backpack.jpg";
  }

  // 状态文字
  function getMyItemStatusText(item) {
    if (item.type === "寻物") {
      if (item.status === "已找到") {
        return "已找到";
      }

      return "寻找中";
    }

    if (item.type === "招领") {
      if (item.status === "已归还") {
        return "已归还";
      }

      return "招领中";
    }

    return "进行中";
  }

  // 生成“我的”列表卡片
  function myItemCardHtml(item) {
    var id = escapeHtml(item.id);
    var name = escapeHtml(item.name);
    var category = escapeHtml(item.category);
    var time = escapeHtml(item.time);
    var location = escapeHtml(item.location);

    var image = item.image || getItemImage(item.category);

    var statusText = getMyItemStatusText(item);

    var statusClass = "active";

    if (item.status === "已找到" || item.status === "已归还") {
      statusClass = "done";
    }

    var actionHtml = "";

    // 寻物：进行中显示“标记已找到”
    if (item.type === "寻物" && item.status !== "已找到") {
      actionHtml =
        '<button class="status-btn" ' +
        "onclick=\"event.stopPropagation();markMyLostDone('" +
        id +
        "')\">" +
        "标记已找到" +
        "</button>";
    }

    // 招领：进行中显示“标记已归还”
    if (item.type === "招领" && item.status !== "已归还") {
      actionHtml =
        '<button class="status-btn" ' +
        "onclick=\"event.stopPropagation();markMyFoundDone('" +
        id +
        "')\">" +
        "标记已归还" +
        "</button>";
    }

    return (
      '<div class="list-item" ' +
      'data-status="' +
      statusClass +
      '" ' +
      'data-id="' +
      id +
      '" ' +
      "onclick=\"goToDetail('" +
      id +
      "')\">" +
      '<div class="item-image">' +
      "<img " +
      'class="item-image-real" ' +
      'src="' +
      image +
      '" ' +
      'alt="' +
      name +
      '">' +
      "</div>" +
      '<div class="item-content">' +
      '<div class="row-first">' +
      '<span class="tag-status ' +
      statusClass +
      '">' +
      statusText +
      "</span>" +
      '<span class="tag-item-type">' +
      category +
      "</span>" +
      "</div>" +
      '<div class="item-name">' +
      name +
      "</div>" +
      '<div class="row-info">' +
      "📅 " +
      time +
      "</div>" +
      '<div class="row-info">' +
      "📍 " +
      location +
      "</div>" +
      '<div class="card-actions">' +
      actionHtml +
      "<button " +
      'class="detail-btn" ' +
      "onclick=\"event.stopPropagation();goToDetail('" +
      id +
      "')\">" +
      "查看详情 >" +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  // 空列表
  function myListEmptyHtml(type) {
    var text =
      type === "lost"
        ? "当前没有符合条件的寻物信息"
        : "当前没有符合条件的招领信息";

    return (
      '<div class="empty-state">' +
      '<div class="empty-icon">🔍</div>' +
      '<div class="empty-title">暂无相关信息</div>' +
      '<div class="empty-text">' +
      text +
      "</div>" +
      "</div>"
    );
  }

  // 渲染我的寻物
  function renderMyLostList() {
    var view = getView("myLost");

    if (!view || !window.LostFoundStore) {
      return;
    }

    var allItems = LostFoundStore.getItems();

    // 当前用户
    var currentUserId = LostFoundStore.getCurrentUserId();

    // 只显示“当前用户自己发布的寻物”
    var items = allItems.filter(function (item) {
      return item.type === "寻物" && item.ownerId === currentUserId;
    });

    var filter = myListFilter.myLost || "all";

    if (filter === "active") {
      items = items.filter(function (item) {
        return item.status === "进行中";
      });
    }

    if (filter === "done") {
      items = items.filter(function (item) {
        return item.status === "已找到";
      });
    }

    // 找到列表区域
    var panel = view.querySelector(".scroll-panel");

    if (!panel) {
      return;
    }

    // 更新数量
    var count = view.querySelector(".summary-count");

    if (count) {
      count.textContent = items.length;
    }

    if (items.length === 0) {
      panel.innerHTML = myListEmptyHtml("lost");
      return;
    }

    panel.innerHTML = items.map(myItemCardHtml).join("");
  }

  // 渲染我的招领
  function renderMyFoundList() {
    var view = getView("myFound");

    if (!view || !window.LostFoundStore) {
      return;
    }

    var allItems = LostFoundStore.getItems();

    var currentUserId = LostFoundStore.getCurrentUserId();

    // 只显示当前用户自己发布的招领
    var items = allItems.filter(function (item) {
      return item.type === "招领" && item.ownerId === currentUserId;
    });

    var filter = myListFilter.myFound || "all";

    if (filter === "active") {
      items = items.filter(function (item) {
        return item.status === "进行中";
      });
    }

    if (filter === "done") {
      items = items.filter(function (item) {
        return item.status === "已归还";
      });
    }

    var panel = view.querySelector(".scroll-panel");

    if (!panel) {
      return;
    }

    // 更新数量
    var count = view.querySelector(".summary-count");

    if (count) {
      count.textContent = items.length;
    }

    if (items.length === 0) {
      panel.innerHTML = myListEmptyHtml("found");
      return;
    }

    panel.innerHTML = items.map(myItemCardHtml).join("");
  }

  // 我的页面筛选
  window.filterItems = function (filter, button) {
    var view = button ? button.closest(".view") : null;

    if (!view) {
      return;
    }

    var route = view.getAttribute("data-route");

    // 更新按钮状态
    $$(".filter-btn", view).forEach(function (btn) {
      btn.classList.remove("active");
    });

    if (button) {
      button.classList.add("active");
    }

    if (route === "myLost") {
      myListFilter.myLost = filter;
      renderMyLostList();
    }

    if (route === "myFound") {
      myListFilter.myFound = filter;
      renderMyFoundList();
    }
  };

  // 标记“我的寻物”已找到
  window.markMyLostDone = function (id) {
    var item = LostFoundStore.getItemById(id);

    if (!item) {
      return;
    }

    var secret = item.secret;

    var result = LostFoundStore.updateStatus(id, secret, "已找到");

    if (result) {
      renderMyLostList();
    }
  };

  // 标记“我的招领”已归还
  window.markMyFoundDone = function (id) {
    var item = LostFoundStore.getItemById(id);

    if (!item) {
      return;
    }

    var secret = item.secret;

    var result = LostFoundStore.updateStatus(id, secret, "已归还");

    if (result) {
      renderMyFoundList();
    }
  };

  function markStatus(btn, text) {
    var view = btn.closest(".view");
    var card = btn.closest(".list-item");
    if (!view || !card) return;

    var status = $(".tag-status", card);
    status.innerText = text;
    status.classList.remove("active");
    status.classList.add("done");
    card.setAttribute("data-status", "done");
    btn.remove();

    var activeFilter = $(".filter-btn.active", view);
    if (activeFilter && activeFilter.getAttribute("data-filter") === "active") {
      var activeButton = $('.filter-btn[data-filter="active"]', view);
      if (activeButton) listFilter("active", activeButton);
    }
  }

  window.markFound = function (btn) {
    markStatus(btn, "已找到");
  };

  window.markReturned = function (btn) {
    markStatus(btn, "已归还");
  };

  // ===== 我的收藏 =====
  function favoriteFilter(type, btn) {
    var view = btn.closest(".view");
    if (!view) return;

    var buttons = $$(".filter-btn", view);
    var cards = $$(".favorite-card", view);
    var visibleCount = 0;

    buttons.forEach(function (item) {
      item.classList.remove("active");
    });
    btn.classList.add("active");

    cards.forEach(function (card) {
      var cardType = card.getAttribute("data-type");
      var show = type === "all" || cardType === type;
      card.style.display = show ? "flex" : "none";
      if (show) visibleCount++;
    });

    updateFavoriteEmpty(view, visibleCount);
  }

  function updateFavoriteCount(view) {
    var cards = $$(".favorite-card", view);
    var countText = $("#countText", view);
    if (countText) countText.textContent = cards.length + " 条";
  }

  function updateFavoriteEmpty(view, count) {
    var list = $("#favoriteList", view);
    var empty = $("#emptyState", view);
    if (!list || !empty) return;

    if (count === 0) {
      list.style.display = "none";
      empty.style.display = "flex";
    } else {
      list.style.display = "flex";
      empty.style.display = "none";
    }
  }

  window.removeFavorite = function (event, button) {
    event.stopPropagation();
    var view = button.closest(".view");
    if (!view) return;

    var card = button.closest(".favorite-card");
    if (card) card.remove();
    updateFavoriteCount(view);
    window.showToast("已取消收藏", view);

    var visibleCount = 0;
    $$(".favorite-card", view).forEach(function (item) {
      if (item.style.display !== "none") visibleCount++;
    });
    updateFavoriteEmpty(view, visibleCount);
  };

  // ===== 统一处理“我的寻物 / 我的招领 / 我的收藏”筛选 =====
  window.filterItems = function (filter, btn) {
    if (!btn) return;

    var view = btn.closest(".view");
    if (!view) return;

    var route = view.getAttribute("data-route");

    // 我的收藏
    if (route === "favorites") {
      favoriteFilter(filter, btn);
      return;
    }

    // 我的寻物
    if (route === "myLost") {
      $$(".filter-btn", view).forEach(function (item) {
        item.classList.remove("active");
      });

      btn.classList.add("active");

      myListFilter.myLost = filter;
      renderMyLostList();
      return;
    }

    // 我的招领
    if (route === "myFound") {
      $$(".filter-btn", view).forEach(function (item) {
        item.classList.remove("active");
      });

      btn.classList.add("active");

      myListFilter.myFound = filter;
      renderMyFoundList();
      return;
    }
  };

  // ===== 搜索页 =====
  var searchTimeFilter = "all";
  var searchCategoryFilter = "全部";

  function getSearchImage(category) {
    var map = {
      校园卡: "images/campus-card.jpg",
      钥匙: "images/keys.jpg",
      水杯: "images/water-bottle.jpg",
      雨伞: "images/umbrella.jpg",
      耳机: "images/earphones.jpg",
      书籍: "images/books.jpg",
      其他: "images/backpack.jpg",
    };
    return map[category] || map["其他"];
  }

  function parseItemTime(value) {
    if (!value) return null;
    var text = String(value).trim().replace(" ", "T");
    var date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
  }

  function searchTimeMatch(item, range) {
    if (!range || range === "all") return true;

    var itemDate = parseItemTime(item.time);
    if (!itemDate) return false;

    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === "today") {
      return itemDate >= start;
    }

    var days = range === "3days" ? 3 : range === "7days" ? 7 : 30;
    var from = new Date(start);
    from.setDate(from.getDate() - (days - 1));
    return itemDate >= from;
  }

  function getSearchFilters() {
    return {
      keyword: ($("#searchInput", getView("search")) || {}).value || "",
      category:
        ($("#searchCategoryFilter", getView("search")) || {}).value || "全部",
      time: ($("#searchTimeFilter", getView("search")) || {}).value || "all",
    };
  }

  function searchMatches(item, filters) {
    var keyword = String(filters.keyword || "")
      .trim()
      .toLowerCase();
    var categoryMatch =
      filters.category === "全部" || item.category === filters.category;
    if (!categoryMatch || !searchTimeMatch(item, filters.time)) return false;

    if (!keyword) return true;

    // 搜索范围明确覆盖：物品名称、地点、物品类型、时间。
    var haystack = [
      item.name,
      item.location,
      item.category,
      item.type,
      item.time,
      item.description,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.indexOf(keyword) !== -1;
  }

  function searchCardHtml(item) {
    var id = escapeHtml(item.id);
    var typeClass = item.type === "招领" ? "found" : "lost";
    var typeLabel = escapeHtml(item.type || "寻物");
    var category = escapeHtml(item.category || "其他");
    var name = escapeHtml(item.name || "未命名物品");
    var time = escapeHtml(item.time || "时间未知");
    var location = escapeHtml(item.location || "地点未知");
    var image = escapeHtml(item.image || getSearchImage(item.category));

    return (
      '<div class="list-item" onclick="openDetail(\'' +
      id +
      "')\">" +
      '<div class="item-image">' +
      '<img class="item-image-real" src="' +
      image +
      '" alt="' +
      name +
      '">' +
      "</div>" +
      '<div class="item-content">' +
      '<div class="row-first">' +
      '<span class="tag-status ' +
      typeClass +
      '">' +
      typeLabel +
      "</span>" +
      '<span class="tag-item-type">' +
      category +
      "</span>" +
      "</div>" +
      '<div class="item-name search-item-name">' +
      name +
      "</div>" +
      '<div class="row-time">📅 ' +
      time +
      "</div>" +
      '<div class="row-location">📍 ' +
      location +
      "</div>" +
      '<div class="detail-link">&gt; 查看详情</div>' +
      "</div>" +
      "</div>"
    );
  }

  function renderSearchResults(showMessage) {
    var view = getView("search");
    if (!view) return 0;

    var store = window.LostFoundStore;
    var resultList = $("#searchResultList", view);
    var empty = $("#empty", view);
    var emptyText = $("#emptyText", view);
    var resultCount = $("#resultCount", view);
    var success = $("#searchSuccess", view);

    if (!store || typeof store.getItems !== "function") {
      if (resultList) resultList.innerHTML = "";
      if (resultCount) resultCount.innerText = "共 0 条";
      if (empty) empty.style.display = "block";
      if (emptyText) emptyText.innerText = "暂时无法读取失物数据";
      return 0;
    }

    var filters = getSearchFilters();
    var items = store.getItems().filter(function (item) {
      return searchMatches(item, filters);
    });

    items.sort(function (a, b) {
      var timeA = a.createdAt || "";
      var timeB = b.createdAt || "";

      if (timeA === timeB) return 0;
      return timeA > timeB ? -1 : 1;
    });

    if (resultList) {
      resultList.innerHTML = items.map(searchCardHtml).join("");
    }
    if (resultCount) resultCount.innerText = "共 " + items.length + " 条";

    if (empty) empty.style.display = items.length ? "none" : "block";

    if (emptyText && !items.length) {
      emptyText.innerText = filters.keyword
        ? "没有找到包含“" +
          filters.keyword +
          "”的物品，请换个关键词或筛选条件试试"
        : "暂时没有找到符合当前筛选条件的物品";
    }

    if (success) {
      if (showMessage && filters.keyword) {
        success.style.display = "block";
        success.innerHTML =
          "搜索“" +
          escapeHtml(filters.keyword) +
          "”，找到 " +
          items.length +
          " 条相关信息";
      } else {
        success.style.display = "none";
        success.innerHTML = "";
      }
    }

    return items.length;
  }

  window.applySearchFilters = function () {
    var view = getView("search");
    if (!view) return;

    searchTimeFilter = ($("#searchTimeFilter", view) || {}).value || "all";
    searchCategoryFilter =
      ($("#searchCategoryFilter", view) || {}).value || "全部";
    renderSearchResults(false);
  };

  window.resetSearchFilters = function () {
    var view = getView("search");
    if (!view) return;

    var input = $("#searchInput", view);
    var time = $("#searchTimeFilter", view);
    var category = $("#searchCategoryFilter", view);

    if (input) input.value = "";
    if (time) time.value = "all";
    if (category) category.value = "全部";

    searchTimeFilter = "all";
    searchCategoryFilter = "全部";
    renderSearchResults(false);
  };

  window.searchItems = function () {
    var view = getView("search");
    if (!view) return;
    renderSearchResults(true);
  };

  // ===== 详情页 =====
  window.toggleMore = function () {
    var view = getView("detail");
    if (!view) return;
    var menu = $("#moreMenu", view);
    if (menu) menu.classList.toggle("show");
  };

  window.toggleFavorite = function () {
    var view = getView("detail");
    if (!view) return;

    detailFavorite = !detailFavorite;
    var button = $("#favoriteBtn", view);
    var icon = $("#favoriteIcon", view);
    var text = $("#favoriteText", view);

    if (detailFavorite) {
      button.classList.add("active");
      icon.innerText = "♥";
      text.innerText = "已收藏";
    } else {
      button.classList.remove("active");
      icon.innerText = "♡";
      text.innerText = "收藏";
    }
  };

  window.openContact = function () {
    var view = getView("detail");
    var modal = $("#contactModal", view);
    if (modal) modal.classList.add("show");
  };

  window.shareItem = function () {
    var view = getView("detail");
    var menu = $("#moreMenu", view);
    var modal = $("#shareModal", view);
    if (menu) menu.classList.remove("show");
    if (modal) modal.classList.add("show");
  };

  window.reportItem = function () {
    var view = getView("detail");
    var menu = $("#moreMenu", view);
    var modal = $("#reportModal", view);
    if (menu) menu.classList.remove("show");
    if (modal) modal.classList.add("show");
  };

  window.closeAllModal = function () {
    var view = getView("detail");
    ["contactModal", "shareModal", "reportModal"].forEach(function (id) {
      var modal = document.getElementById(id);
      if (modal) modal.classList.remove("show");
    });
  };

  window.closeModal = function (event) {
    if (event.target === event.currentTarget) {
      window.closeAllModal();
    }
  };

  window.submitReport = function (type) {
    window.alert("已提交举报\n\n举报原因：" + type);
    window.closeAllModal();
  };

  document.addEventListener("click", function (event) {
    var view = getView("detail");
    if (!view || !view.classList.contains("active")) return;
    var menu = $("#moreMenu", view);
    var topBar = $(".top-bar", view);
    if (topBar && menu && !topBar.contains(event.target)) {
      menu.classList.remove("show");
    }
  });

  // ===== 个人信息 =====
  // 默认数据
  var DEFAULT_USER_INFO = {
    name: "马头",
    signature: "春风若有怜花意，可否许我再少年",
    qq: "",
    wechat: "",
    phone: "",
    avatar: "",
  };

  // 统一读取个人信息
  function getUserInfo() {
    var saved = localStorage.getItem("userInfo");

    if (!saved) {
      return {
        name: DEFAULT_USER_INFO.name,
        signature: DEFAULT_USER_INFO.signature,
        qq: DEFAULT_USER_INFO.qq,
        wechat: DEFAULT_USER_INFO.wechat,
        phone: DEFAULT_USER_INFO.phone,
        avatar: DEFAULT_USER_INFO.avatar,
      };
    }

    try {
      var savedInfo = JSON.parse(saved);

      return {
        name: savedInfo.name || DEFAULT_USER_INFO.name,
        signature: savedInfo.signature || DEFAULT_USER_INFO.signature,
        qq: savedInfo.qq || "",
        wechat: savedInfo.wechat || "",
        phone: savedInfo.phone || "",
        avatar: savedInfo.avatar || "",
      };
    } catch (error) {
      console.log("读取个人信息失败");

      return {
        name: DEFAULT_USER_INFO.name,
        signature: DEFAULT_USER_INFO.signature,
        qq: "",
        wechat: "",
        phone: "",
        avatar: "",
      };
    }
  }
  window.changeAvatar = function (event) {
    var view = event.target.closest(".view");
    var file = event.target.files && event.target.files[0];
    if (!view || !file || file.type.indexOf("image/") !== 0) return;

    var reader = new FileReader();
    reader.onload = function (e) {
      var avatar = $("#avatar", view);
      if (avatar) avatar.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  window.saveInfo = function () {
    var view = getView("profile");
    if (!view) return;

    var avatar = $("#avatar", view);

    var userInfo = {
      name: $("#name", view).value.trim(),
      signature: $("#signature", view).value.trim(),
      qq: $("#qq", view).value.trim(),
      wechat: $("#wechat", view).value.trim(),
      phone: $("#phone", view).value.trim(),
      avatar: avatar ? avatar.src : "",
    };
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
    loadMineProfile();
    window.showToast("保存成功", view);
    setTimeout(function () {
      window.location.hash = "mine";
    }, 500);
  };

  function loadProfile() {
    var view = getView("profile");
    if (!view) return;

    var userInfo = getUserInfo();

    var name = $("#name", view);
    var signature = $("#signature", view);
    var qq = $("#qq", view);
    var wechat = $("#wechat", view);
    var phone = $("#phone", view);
    var avatar = $("#avatar", view);

    if (name) name.value = userInfo.name;
    if (signature) signature.value = userInfo.signature;
    if (qq) qq.value = userInfo.qq;
    if (wechat) wechat.value = userInfo.wechat;
    if (phone) phone.value = userInfo.phone;

    if (avatar && userInfo.avatar) {
      avatar.src = userInfo.avatar;
    }
  }

  function loadMineProfile() {
    var view = getView("mine");
    if (!view) return;

    var userInfo = getUserInfo();

    var name = $(".profile-name", view);
    var signature = $(".profile-signature", view);
    var avatar = $(".avatar-placeholder", view);

    if (name) {
      name.textContent = userInfo.name;
    }

    if (signature) {
      signature.textContent = userInfo.signature;
    }

    if (avatar && userInfo.avatar) {
      avatar.style.backgroundImage = 'url("' + userInfo.avatar + '")';
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.style.backgroundRepeat = "no-repeat";
    }
  }
  // ===== Toast =====
  window.showToast = function (text, view) {
    var v = view || activeView();
    if (!v) return;
    var toast = $(".toast", v);
    if (!toast) return;

    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove("show");
    }, 1600);
  };

  // ===== 初始化 =====
  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("DOMContentLoaded", function () {
    renderRoute();
    loadProfile();

    var searchInput = document.querySelector("#view-search #searchInput");
    if (searchInput) {
      searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          window.searchItems();
        }
      });
    }
  });
})();
