/*
 * 校园失物招领 - 数据层
 *
 * 该文件只负责数据模型、localStorage 持久化和数据操作，
 * 不直接依赖 UI。UI 后续通过 window.LostFoundStore 访问。
 *
 * 记录模型：
 * {
 *   id: string,
 *   type: '寻物' | '招领',
 *   name: string,
 *   category: string,
 *   location: string,
 *   time: string,
 *   description: string,
 *   contact: string,
 *   image: string,
 *   ownerId: string,
 *   status: '进行中' | '已找到' | '已归还',
 *   secret: string,
 *   createdAt: string
 * }
 */
(function (global) {
  ("use strict");

  var STORAGE_KEY = "lost_found_items";
  var FAVORITES_KEY = "lost_found_favorites";

  var TYPES = {
    LOST: "寻物",
    FOUND: "招领",
  };

  var STATUSES = {
    ACTIVE: "进行中",
    FOUND: "已找到",
    RETURNED: "已归还",
  };

  var CATEGORIES = ["校园卡", "钥匙", "水杯", "雨伞", "耳机", "书籍", "其他"];

  var TYPE_VALUES = [TYPES.LOST, TYPES.FOUND];
  var STATUS_VALUES = [STATUSES.ACTIVE, STATUSES.FOUND, STATUSES.RETURNED];

  var CATEGORY_IMAGE = {
    校园卡: "images/campus-card.jpg",
    钥匙: "images/keys.jpg",
    水杯: "images/water-bottle.jpg",
    雨伞: "images/umbrella.jpg",
    耳机: "images/earphones.jpg",
    书籍: "images/books.jpg",
    其他: "images/backpack.jpg",
  };

  // 首次打开时写入的种子数据，覆盖所有类别和状态，方便浏览与搜索测试。
  var SEED_ITEMS = [
    {
      id: "item1",
      type: TYPES.LOST,
      name: "蓝色校园卡",
      category: "校园卡",
      location: "图书馆三楼",
      time: "2026-09-28 14:30",
      description: "蓝色校园卡，卡面为蓝色，可能在图书馆三楼学习时不小心遗失。",
      contact: "138****5678",
      image: "",
      status: STATUSES.ACTIVE,
      secret: "123456",
      createdAt: "2026-09-28T06:30:00.000Z",
    },
    {
      id: "item2",
      type: TYPES.FOUND,
      name: "一串黑色钥匙",
      category: "钥匙",
      location: "学习中心四楼",
      time: "2026-09-28 09:15",
      description: "捡到一串黑色钥匙，带有一个小熊挂件，请失主看到后联系确认。",
      contact: "138****1111",
      image: "",
      status: STATUSES.ACTIVE,
      secret: "234567",
      createdAt: "2026-09-28T01:15:00.000Z",
    },
    {
      id: "item3",
      type: TYPES.LOST,
      name: "深蓝色保温杯",
      category: "水杯",
      location: "东3-303",
      time: "2026-09-27 18:40",
      description:
        "深蓝色保温杯，杯身底部有一处轻微划痕，下课后可能落在东3-303教室。",
      contact: "138****2222",
      image: "",
      status: STATUSES.FOUND,
      secret: "345678",
      createdAt: "2026-09-27T10:40:00.000Z",
    },
    {
      id: "item4",
      type: TYPES.FOUND,
      name: "黑色长柄雨伞",
      category: "雨伞",
      location: "玫瑰园食堂",
      time: "2026-09-27 12:20",
      description:
        "在玫瑰园食堂座位旁捡到一把黑色长柄雨伞，请失主携带特征说明前来认领。",
      contact: "138****3333",
      image: "",
      status: STATUSES.RETURNED,
      secret: "456789",
      createdAt: "2026-09-27T04:20:00.000Z",
    },
    {
      id: "item5",
      type: TYPES.LOST,
      name: "白色无线耳机",
      category: "耳机",
      location: "学习中心四楼",
      time: "2026-09-26 20:10",
      description:
        "白色入耳式无线耳机，装在一个小收纳盒里，晚上自习时可能遗落在学习中心四楼。",
      contact: "138****4444",
      image: "",
      status: STATUSES.ACTIVE,
      secret: "567890",
      createdAt: "2026-09-26T12:10:00.000Z",
    },
    {
      id: "item6",
      type: TYPES.FOUND,
      name: "《大学英语》教材",
      category: "书籍",
      location: "西3-103",
      time: "2026-09-26 15:05",
      description:
        "在西3-103教室捡到一本《大学英语》教材，扉页有手写笔记，请失主联系取回。",
      contact: "138****5555",
      image: "",
      status: STATUSES.ACTIVE,
      secret: "678901",
      createdAt: "2026-09-26T07:05:00.000Z",
    },
    {
      id: "item7",
      type: TYPES.LOST,
      name: "黑色双肩背包",
      category: "其他",
      location: "图书馆三楼",
      time: "2026-09-26 08:50",
      description:
        "黑色双肩背包，外侧口袋有一个钥匙扣，可能在图书馆三楼阅览区遗忘。",
      contact: "138****6666",
      image: "",
      status: STATUSES.ACTIVE,
      secret: "789012",
      createdAt: "2026-09-26T00:50:00.000Z",
    },
  ];

  // 旧版静态页面里的详情 id，映射到新数据记录，保持当前 UI 跳转可用。
  var APP_ALIASES = {
    lost1: "item1",
    lost2: "item5",
    lost3: "item3",
    found1: "item2",
    found2: "item4",
    found3: "item6",
    card: "item1",
    keys: "item2",
    earphone: "item5",
    umbrella: "item4",
  };

  // 获取当前浏览器中的用户 ID
  function getCurrentUserId() {
    var key = "campus_lost_found_user_id";
    var userId = global.localStorage.getItem(key);

    if (!userId) {
      userId =
        "user_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 10);

      global.localStorage.setItem(key, userId);
    }

    return userId;
  }

  function generateId() {
    return (
      "item_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function generateSecret() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // 记录当前用户本地ID
  var CURRENT_USER_KEY = "campus_lost_found_user_id";

  function getCurrentUserId() {
    try {
      var userId = global.localStorage.getItem(CURRENT_USER_KEY);

      if (!userId) {
        userId =
          "user_" +
          Date.now().toString(36) +
          "_" +
          Math.random().toString(36).slice(2, 8);

        global.localStorage.setItem(CURRENT_USER_KEY, userId);
      }

      return userId;
    } catch (error) {
      // localStorage 不可用时，使用一个临时 ID
      return "local_user";
    }
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readItems() {
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      var items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  function writeItems(items) {
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function seedIfNeeded() {
    try {
      if (global.localStorage.getItem(STORAGE_KEY) === null) {
        writeItems(clone(SEED_ITEMS));
      }
    } catch (error) {
      // 存储不可用时，数据层仍可回退到内存种子数据。
    }
  }

  function createItem(input) {
    input = input || {};

    var type = TYPE_VALUES.indexOf(input.type) !== -1 ? input.type : TYPES.LOST;

    var category =
      CATEGORIES.indexOf(input.category) !== -1 ? input.category : "其他";

    var status =
      STATUS_VALUES.indexOf(input.status) !== -1
        ? input.status
        : STATUSES.ACTIVE;

    return {
      id: input.id || generateId(),
      ownerId: input.ownerId || getCurrentUserId(),
      // 发布类型
      type: type,
      // 当前发布者
      ownerId: input.ownerId || getCurrentUserId(),

      name: String(input.name || "").trim(),
      category: category,
      location: String(input.location || "").trim(),
      time: String(input.time || "").trim(),
      description: String(input.description || "").trim(),
      contact: String(input.contact || "").trim(),
      image: input.image || "",
      status: status,
      secret: input.secret ? String(input.secret) : generateSecret(),
      createdAt: input.createdAt || new Date().toISOString(),
    };
  }

  function addItem(input) {
    seedIfNeeded();
    var items = readItems();
    var item = createItem(input);
    items.unshift(item);
    writeItems(items);
    // 新数据写入后同步 APP_DATA，详情页可以立即读取刚发布的记录。
    buildAppData();
    return item;
  }

  function getItems() {
    seedIfNeeded();
    return readItems();
  }

  function getItemById(id) {
    seedIfNeeded();
    var items = readItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        return items[i];
      }
    }
    return null;
  }

  // 纯函数：根据 filters 过滤 items。
  // filters 支持：type、category、status、keyword。
  function filterItems(items, filters) {
    filters = filters || {};
    var list = Array.isArray(items) ? items : [];
    var keyword = normalizeText(filters.keyword);

    return list.filter(function (item) {
      if (filters.type && item.type !== filters.type) {
        return false;
      }
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      var itemTime = item.time
        ? new Date(String(item.time).replace(" ", "T"))
        : null;
      if (filters.timeFrom) {
        var timeFrom = new Date(filters.timeFrom);
        if (!itemTime || isNaN(itemTime.getTime()) || itemTime < timeFrom) {
          return false;
        }
      }
      if (filters.timeTo) {
        var timeTo = new Date(filters.timeTo);
        if (!itemTime || isNaN(itemTime.getTime()) || itemTime > timeTo) {
          return false;
        }
      }

      if (keyword) {
        var haystack = [
          item.name,
          item.category,
          item.location,
          item.time,
          item.description,
          item.contact,
          item.type,
          item.status,
        ]
          .join(" ")
          .toLowerCase();

        if (haystack.indexOf(keyword) === -1) {
          return false;
        }
      }

      return true;
    });
  }

  function searchItems(keyword, items) {
    var list = Array.isArray(items) ? items : getItems();
    var normalized = normalizeText(keyword);
    if (!normalized) {
      return list.slice();
    }
    return filterItems(list, { keyword: normalized });
  }

  function updateStatus(id, secret, status) {
    seedIfNeeded();

    if (STATUS_VALUES.indexOf(status) === -1) {
      return null;
    }

    var items = readItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        if (items[i].secret !== String(secret)) {
          return null;
        }
        items[i].status = status;
        writeItems(items);
        return items[i];
      }
    }

    return null;
  }

  function updateItem(id, input) {
    seedIfNeeded();

    input = input || {};

    var items = readItems();

    for (var i = 0; i < items.length; i++) {
      if (items[i].id !== id) {
        continue;
      }

      // 只能修改自己的记录
      if (items[i].ownerId !== getCurrentUserId()) {
        return null;
      }

      items[i].type = input.type === TYPES.FOUND ? TYPES.FOUND : TYPES.LOST;

      if (input.name !== undefined) {
        items[i].name = String(input.name).trim();
      }

      if (input.category !== undefined) {
        items[i].category =
          CATEGORIES.indexOf(input.category) !== -1 ? input.category : "其他";
      }

      if (input.location !== undefined) {
        items[i].location = String(input.location).trim();
      }

      if (input.time !== undefined) {
        items[i].time = String(input.time).trim();
      }

      if (input.description !== undefined) {
        items[i].description = String(input.description).trim();
      }

      if (input.contact !== undefined) {
        items[i].contact = String(input.contact).trim();
      }

      if (input.image !== undefined) {
        items[i].image = input.image || "";
      }

      writeItems(items);

      // 更新详情页数据
      buildAppData();

      return items[i];
    }

    return null;
  }

  // ===== 收藏数据层 =====
  function readFavoriteIds() {
    try {
      var raw = global.localStorage.getItem(FAVORITES_KEY);
      var ids = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(ids)) {
        return [];
      }
      return ids.filter(function (id) {
        return typeof id === "string" && id.length > 0;
      });
    } catch (error) {
      return [];
    }
  }

  function writeFavoriteIds(ids) {
    try {
      global.localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
    } catch (error) {
      // localStorage 不可用时收藏无法持久化，调用方仍可安全继续执行。
    }
  }

  function addFavorite(id) {
    var favoriteId = String(id || "");
    if (!favoriteId) {
      return getFavorites();
    }

    var ids = readFavoriteIds();
    if (ids.indexOf(favoriteId) === -1) {
      ids.push(favoriteId);
      writeFavoriteIds(ids);
    }

    return getFavorites();
  }

  function removeFavorite(id) {
    var favoriteId = String(id || "");
    var ids = readFavoriteIds().filter(function (item) {
      return item !== favoriteId;
    });
    writeFavoriteIds(ids);
    return getFavorites();
  }

  function getFavorites() {
    return readFavoriteIds();
  }

  function isFavorite(id) {
    return readFavoriteIds().indexOf(String(id || "")) !== -1;
  }

  // 保持当前详情页可读：把新数据模型转换成旧版 app.js 期望的字段。
  function toAppItem(record) {
    var isFound = record.type === TYPES.FOUND;
    return {
      id: record.id,
      type: isFound ? "found" : "lost",
      category: record.category,
      image:
        record.image ||
        CATEGORY_IMAGE[record.category] ||
        CATEGORY_IMAGE["其他"],
      title: record.name,
      location: record.location,
      time: record.time,
      desc: record.description,
      publisher: "同学",
      contact: record.contact,
      wechat: "见联系方式",
    };
  }

  function buildAppData() {
    var items = getItems().map(toAppItem);
    var itemsById = {};

    items.forEach(function (item) {
      itemsById[item.id] = item;
    });

    Object.keys(APP_ALIASES).forEach(function (alias) {
      var target = APP_ALIASES[alias];
      if (itemsById[target]) {
        itemsById[alias] = itemsById[target];
      }
    });

    global.APP_DATA = {
      items: items,
      itemsById: itemsById,
    };
  }

  var Store = {
    STORAGE_KEY: STORAGE_KEY,
    TYPES: TYPES,
    STATUSES: STATUSES,
    CATEGORIES: CATEGORIES,
    getCurrentUserId: getCurrentUserId,
    seedIfNeeded: seedIfNeeded,
    createItem: createItem,
    addItem: addItem,
    getItems: getItems,
    getItemById: getItemById,
    searchItems: searchItems,
    filterItems: filterItems,
    updateStatus: updateStatus,
    updateItem: updateItem,
    addFavorite: addFavorite,
    removeFavorite: removeFavorite,
    getFavorites: getFavorites,
    isFavorite: isFavorite,
  };

  global.LostFoundStore = Store;

  seedIfNeeded();
  buildAppData();
})(window);
