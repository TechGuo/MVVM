//MVVM类
class MVVM {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    //对模板进行编译
    if (this.$el) {
      // 数据劫持 就是把对象的所有属性， 改成get方法和set发那个发
      new Observer(this.$data)
      this.proxyData(this.$data);
      // 用数据和 元素进行编译
      new Compile(this.$el, this);

    }
  }
  proxyData(data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get() {
          return data(key)
        },
        set(newValue) {
          data[key] = newValue;
        }
      })
    })
  }
}

// Compile类
class Compile {
  constructor(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    if (this.el) {
      // 如果el元素存在，能够获取到，才进行编译
      // 1先将真事的dom存入到内存当中
      let fragment = this.node2frament(this.el)
      // 编译  提取想要的元素结点 v-model和文本结点{{}}
      this.compile(fragment);
      // 把编译好的fragment再塞回页面中
      this.el.appendChild(fragment);
    }

  }
  /* 辅助函数区域 */
  // 判断当前元素是不是node结点
  isElementNode(node) {
    return node.nodeType === 1;
  }
  /* 核心方法区 */
  node2frament(el) {
    // 将el内容全部都放进到内存中
    let fragment = document.createDocumentFragment();
    let firstChild;
    while (firstChild = el.firstChild) {
      fragment.appendChild(firstChild);
    };
    return fragment;//内存中的结点
  }
  compile(fragment) {
    let childNodes = fragment.childNodes;
    // 需要递归，去拿到所有文本结点，也就是子结点的子结点，子结点的子结点
    Array.from(childNodes).forEach(node => {
      if (this.isElementNode(node)) {
        // 元素结点
        // 这里需要编译元素
        this.compileElment(node);
        this.compile(node);
      } else {
        // 文本结点
        // 这里需要编译文本
        this.compileText(node);
      }
    })
  }
  compileElment(node) {
    // 编译带有 v-model v-for v-if ...属性的元素
    let attrs = node.attributes;
    Array.from(attrs).forEach(attr => {
      // 判断属性名字是不是包含v-
      let attrName = attr.name;
      if (this.isDirective(attrName)) {
        // 取到对应的值放在结点中
        let expr = attr.value;
        let type = attrName.slice(2);
        CompileUtil[type](node, this.vm, expr);
      }
    })
  }
  compileText(node) {
    // 判断文本是否含有{{}}
    let expr = node.textContent;//获取结点的文本
    let reg = /\{\{([^}]+)\}\}/g
    if (reg.test(expr)) {
      CompileUtil['text'](node, this.vm, expr);
    }
  }
  isDirective(name) {
    return name.includes('v-');
  }
}

// Compile编译中用到的一些方法 存放在对象中。
CompileUtil = {
  //文本处理,对文本情况是gender.male 的，获取到male的value值，并返回
  getVal(vm, expr) {
    return expr.split('.').reduce((prev, next) => {
      return prev[next]
    }, vm.$data);
  },
  setVal(vm, expr, value) {
    expr = expr.split('.');
    return expr.reduce((prev, next, currentIndex) => {
      if (currentIndex === expr.length - 1) {
        return prev[next] = value;
      }
      return prev[next]
    }, vm.$data)
  },
  getTextVal(vm, expr) {
    return expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      return this.getVal(vm, arguments[1]);
    })
  },
  text(node, vm, expr) {
    let updateFn = this.updater['textUpdater'];
    let value = this.getTextVal(vm, expr);
    // console.log(value);
    expr.replace(/\{\{([^}]+)\}\}/g, (...arguments) => {
      // console.log(arguments[1] + 'hhhh');
      new Watcher(vm, arguments[1], (newValue) => {
        //如果数据变化了，文本结点需要重新获取依赖的数据更新文本中的内容
        updateFn && updateFn(node, this.getTextVal(vm, expr))
      })
    })
    updateFn && updateFn(node, value)

  },
  model(node, vm, expr) {//输入框处理
    let updateFn = this.updater['modelUpdater'];
    new Watcher(vm, expr, (newValue) => {
      //当值变化后会调用cb 将新的值传递过来
      updateFn && updateFn(node, this.getVal(vm, expr))
    })
    node.addEventListener('input', (e) => {
      let newValue = e.target.value;
      this.setVal(vm, expr, newValue)
    })
    updateFn && updateFn(node, this.getVal(vm, expr))
  },
  updater: {
    textUpdater(node, value) {
      // console.log(value);
      node.textContent = value
    },
    modelUpdater(node, value) {
      node.value = value
    }
  }
}

// Observer类
class Observer {
  constructor(data) {
    this.observe(data);
  }
  observe(data) {
    // 要对这个data数据将原有的属性改成set和get的形式
    if (!data || typeof data !== 'object') {
      // 如果数据不存在，或者不是对象数据，就什么都不操作
      return;
    }
    // 是对象类型，就要一一劫持
    Object.keys(data).forEach(key => {
      // console.log(data);
      //定义劫持的响应式
      this.defineReactive(data, key, data[key]);//形参分别是：对象，key关键字，key对应的value值
      // 还需要进行深度劫持，就是将对象中的对象添加上set和get方法，这里可以直接进行递归
      this.observe(data[key])

    })

  }
  // 定义劫持的响应式
  defineReactive(obj, key, value) {
    let that = this;
    // 创建订阅
    let dep = new Dep();//每个变化的数据，都会对应一个数组，这个数组是存放所有更新的操作

    // 在获取某个值的适合，想弹窗
    Object.defineProperty(obj, key, {
      configurable: true,//指定通过循环可以拿到
      enumerable: true,//指定可以删除
      get() {
        Dep.target && dep.addSub(Dep.target)
        return value;
      },
      set(newValue) {
        if (newValue != value) {
          that.observe(newValue)//这里是对newvalue也进行盘算是否是对象，并进行劫持
          value = newValue;
          dep.notify();//通知所有人  数据更新了
        }
      }
    })
  }



}

// Dep类
class Dep {
  constructor() {
    // 订阅的数组
    this.subs = []
  }
  // 添加订阅的方法
  addSub(watcher) {
    this.subs.push(watcher)
  }
  notify() {
    this.subs.forEach(watcher => watcher.updata())
  }
}

// Watcher类
class Watcher {
  // 观察者的目的，就是给需要变化的那个元素添加一个观察者
  // 当数据变化后执行对应的方法
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