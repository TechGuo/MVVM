// 观察者的目的，就是给需要变化的那个元素添加一个观察者
// 当数据变化后执行对应的方法
class Watcher {
  constructor(vm, expr, cd) {//vm是实例，expr是监听的key，cd就是返回函数
    this.vm = vm;
    this.expr = expr;
    this.cd = cd;
    // 先获取一个老的值
    this.value = this.get();
  }
  getVal(vm, expr) {
    return expr.split('.').reduce((prev, next) => {
      return prev[next]
    }, vm.$data);
  }
  get() {
    Dep.target = this;
    let value = this.getVal(this.vm, this.expr);
    Dep.target = null;
    return value
  }
  // 对外暴露的方法
  updata() {
    let newValue = this.getVal(this.vm, this.expr);
    let oldValue = this.value;
    if (newValue != oldValue) {
      this.cd(newValue);//调用watch的callback
    }

  }
}