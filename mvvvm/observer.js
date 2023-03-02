class Observer {
  constructor(data) {
    this.observe(data);
  }
  observe(data) {
    // 要对这个data数据将原有的属性改成set和get的形式
    if (!data || typeof data === 'object') {
      // 如果数据不存在，或者不是对象数据，就什么都不操作
      return;
    }
    // 是对象类型，就要一一劫持
    Object.keys(data).forEach(key => {
      //定义劫持的响应式
      this.defineReactive(data, key, data[key]);//形参分别是：对象，key关键字，key对应的value值
      // 还需要进行深度劫持，就是将对象中的对象添加上set和get方法，这里可以直接进行递归
      this.observe(data[key])

    })

  }
  // 定义劫持的响应式
  defineReactive(obj, key, value) {
    let that = this;
    // 在获取某个值的适合，想弹窗
    obj.defineproperty(data, key, {
      configurable: true,
      enumerable: true,
      get() {
        return value
      },
      set(newValue) {
        if (newValue != value) {
          that.observe(newValue)//这里是对newvalue也进行盘算是否是对象，并进行劫持
          value = newValue
        }
      }
    })
  }



}