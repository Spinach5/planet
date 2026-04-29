// 判断当前编译平台
const isH5 = process.env.TARO_ENV === 'h5';

export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/course/index',
    'pages/student-union/index',
    'pages/club/index',
    'pages/food/index',
    'pages/admin/index',
    'pages/books/index',
    'pages/daily-goods/index',
    'pages/map/index',
    'pages/secondhand-book/index',
    'pages/user/index'
  ],

  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "校园小程序",
    navigationBarTextStyle: "black",
    // 👇 这里是关键！H5 不支持 custom，会黑屏！
    navigationStyle: isH5 ? "default" : "custom"
  },

  // 👇 H5 不显示 tabBar，只在小程序显示
  tabBar: isH5
    ? undefined
    : {
      color: "#666666",
      selectedColor: "#007bff",
      backgroundColor: "#ffffff",
      borderStyle: "black",
      list: [
        {
          pagePath: "pages/index/index",
          text: "首页",
          iconPath: "./assets/首页.png",
          selectedIconPath: "./assets/首页1.png",
        },
        {
          pagePath: "pages/course/index",
          text: "课程",
          iconPath: "./assets/课表信息.png",
          selectedIconPath: "./assets/课表信息1.png",
        },
        {
          pagePath: "pages/user/index",
          text: "我的",
          iconPath: "./assets/我的.png",
          selectedIconPath: "./assets/我的1.png",
        }
      ]
    }
});