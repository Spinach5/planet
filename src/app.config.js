/* eslint-disable no-undef */
export default defineAppConfig({
  pages: [
  'pages/index/index',
  "pages/course/index",
  "pages/user/index",
  "pages/course/index",

],

  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'WeChat',
    navigationBarTextStyle: 'black',
    navigationStyle: 'custom'
  },
  tabBar:{
    color:'#666666',
    selectedColor:'#007bff',
    backgroundColor:'#ffffff',
    borderStyle:'black',
    list:[
      {
        pagePath:'pages/index/index',
        text:'首页',
        iconPath:'assets/首页.png',
        // selectedIconPath:'/images/home_active.png'
      },
      {
        pagePath:'pages/course/index',
        text:'课程',
        // iconPath:'/images/course.png',
      },
      {
        pagePath:'pages/user/index',
        text:'我的',
        // iconPath:'/images/course.png',
      }
    ]
  }

});
