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
    let text = node.textContent;//获取结点的文本
    let reg = /\{\{([^}]+)\}\}/g
    let expr = text.slice(2, -2);//这里将text文本中的{{}}去掉
    if (reg.test(text)) {
      CompileUtil['text'](node, this.vm, expr);
    }
  }
  isDirective(name) {
    return name.includes('v-');
  }
}


CompileUtil = {//文本处理
  getVal(vm, expr) {
    return expr.split('.').reduce((prev, next) => {
      return prev[next]
    }, vm.$data);
  },
  text(node, vm, expr) {
    let updateFn = this.updater['textUpdater'];
    console.log(expr);
    updateFn && updateFn(node, this.getVal(vm, expr))
  },
  model(node, vm, expr) {//输入框处理
    let updateFn = this.updater['modelUpdater'];
    updateFn && updateFn(node, this.getVal(vm, expr))
  },
  updater: {
    textUpdater(node, value) {
      node.textContent = value
    },
    modelUpdater(node, value) {
      node.value = value
    }
  }
}