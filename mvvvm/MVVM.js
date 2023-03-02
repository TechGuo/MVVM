


class MVVM {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    //对模板进行编译
    if (this.$el) {
      // 数据劫持 就是把对象的所有属性， 改成get方法和set发那个发
      new Observer(this.$data)

      // 用数据和 元素进行编译
      new Compile(this.$el, this);

    }
  }
}