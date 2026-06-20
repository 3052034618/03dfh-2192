export default defineAppConfig({
  pages: [
    'pages/availability/index',
    'pages/garage/index',
    'pages/feedback/index',
    'pages/create/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F5F3FF',
    navigationBarTitleText: '约本小助手',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#6C5CE7',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/availability/index',
        text: '我的空档'
      },
      {
        pagePath: 'pages/garage/index',
        text: '熟人车库'
      },
      {
        pagePath: 'pages/feedback/index',
        text: '上车反馈'
      }
    ]
  }
})
