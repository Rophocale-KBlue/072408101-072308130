// 静态原型数据：后续接入真实接口前，页面展示与详情渲染都从这里读取。
window.APP_DATA = {
  items: [
    {
      id: 'item1',
      type: 'lost',
      category: '校园卡',
      emoji: '💳',
      title: '蓝色校园卡',
      location: '图书馆三楼',
      time: '2026-09-28 14:30',
      desc: '蓝色校园卡，卡面为蓝色，可能在图书馆三楼学习时不小心遗失。如果有同学捡到，希望能够联系我，非常感谢！',
      publisher: '小林同学',
      contact: '138****5678',
      wechat: 'xiaolin_123'
    },
    {
      id: 'item2',
      type: 'found',
      category: '钥匙',
      emoji: '🔑',
      title: '一串黑色钥匙',
      location: '学习中心四楼',
      time: '2026-09-28 09:15',
      desc: '捡到一串黑色钥匙，带有一个小熊挂件，请失主看到后尽快联系确认。',
      publisher: '热心同学',
      contact: '138****1111',
      wechat: 'lost_found_helper'
    },
    {
      id: 'item3',
      type: 'lost',
      category: '水杯',
      emoji: '🥤',
      title: '深蓝色保温杯',
      location: '东3-303',
      time: '2026-09-27 18:40',
      desc: '深蓝色保温杯，杯身底部有一处轻微划痕，下课后可能落在东3-303教室。',
      publisher: '阿杰同学',
      contact: '138****2222',
      wechat: 'ajie_0927'
    },
    {
      id: 'item4',
      type: 'found',
      category: '雨伞',
      emoji: '☂️',
      title: '黑色长柄雨伞',
      location: '玫瑰园食堂',
      time: '2026-09-27 12:20',
      desc: '在玫瑰园食堂座位旁捡到一把黑色长柄雨伞，请失主携带特征说明前来认领。',
      publisher: '食堂阿姨',
      contact: '138****3333',
      wechat: 'canteen_service'
    },
    {
      id: 'item5',
      type: 'lost',
      category: '耳机',
      emoji: '🎧',
      title: '白色无线耳机',
      location: '学习中心四楼',
      time: '2026-09-26 20:10',
      desc: '白色入耳式无线耳机，装在一个小收纳盒里，晚上自习时可能遗落在学习中心四楼。',
      publisher: '小周同学',
      contact: '138****4444',
      wechat: 'xiaozhou_0505'
    },
    {
      id: 'item6',
      type: 'found',
      category: '书籍',
      emoji: '📚',
      title: '《大学英语》教材',
      location: '西3-103',
      time: '2026-09-26 15:05',
      desc: '在西3-103教室捡到一本《大学英语》教材，扉页有手写笔记，请失主联系取回。',
      publisher: '学习委员',
      contact: '138****5555',
      wechat: 'study_group_01'
    },
    {
      id: 'item7',
      type: 'lost',
      category: '其他',
      emoji: '🎒',
      title: '黑色双肩背包',
      location: '图书馆三楼',
      time: '2026-09-26 08:50',
      desc: '黑色双肩背包，外侧口袋有一个钥匙扣，可能在图书馆三楼阅览区遗忘。',
      publisher: '李同学',
      contact: '138****6666',
      wechat: 'li_student'
    }
  ]
};

(function () {
  var byId = {};
  window.APP_DATA.items.forEach(function (item) {
    byId[item.id] = item;
  });

  // 各列表页使用的详情 id，统一映射到上面的静态条目。
  var aliases = {
    'lost1': 'item1',
    'lost2': 'item5',
    'lost3': 'item3',
    'found1': 'item2',
    'found2': 'item4',
    'found3': 'item6',
    'card': 'item1',
    'keys': 'item2',
    'earphone': 'item5',
    'umbrella': 'item4'
  };

  Object.keys(aliases).forEach(function (alias) {
    byId[alias] = byId[aliases[alias]];
  });

  window.APP_DATA.itemsById = byId;
})();
