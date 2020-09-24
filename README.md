# RequestIdleCallback 实验

**DEMO: https://linjiayu6.github.io/FE-RequestIdleCallback-demo/**

```
前言: 
- React 16 实现了基于Fiber的调度算法, 和requestIdleCallback 的实现大同小异。
- 为什么 React要自己实现一套调度能力呢? 该API兼容性并不好。
- 这里我们先来实验 requestIdleCallback 对性能 和 用户体验的 影响。
```

<hr/>

## 1. 判断
- 当你需要处理一些不那么重要的事情，同时你又很关注用户体验的话，可以考虑哈 requestIdleCallback。
- 执行前提当浏览器处于空闲状态。

```javascript
// 判断浏览器是否支持该 requestIdleCallback.
if ('requestIdleCallback' in window) {
    console.log('# support `requestIdleCallback`');
    START();
} else {
    console.log('# Your browser does not support `requestIdleCallback`, please try latest Chrome.');
}
```

## 2. 应用
- window.requestIdleCallback(cb) 接收回调函数, 即浏览器空闲时间内调用的函数队列。
- 这样可以将高优和低优工作区分开来，从而不会影响动画或输入的响应。

### 2.1 描述
```javascript
// 大任务分为 N个小任务, 根据浏览器空闲状态, 执行每个小任务
let _u = 0 // 第几个小任务

function cb(deadline) {
    - while 任务是否完成 && 浏览器是否空闲
      - Y: 执行小任务
      - N: 跳出循环
    判断: 
    - 任务全部完成 return 结束
    - 任务未完成, 将待执小任务, 再次放到低优队列里执行 window.requestIdleCallback(cb)
      (这里控制任务的指针 是_u)
 }

// 开始执行: 放到低优队列里
window.requestIdleCallback(cb)
```

### 2.2 代码
```javascript
// 空闲时间 1ms
const FREE_TIME = 1
let _u = 0

// Work.unit 有N个任务
// Work.onOneUnit 每个任务执行的函数
// 对于一个完整任务来说, 将其均分成N(unit)个小任务(onOneUnit)
function cb(deadline) {
    // deadline 传入当前空闲的时间
    // 当任务还没有被处理完 & 空闲时间也够
    while (_u < Work.unit && deadline.timeRemaining() > FREE_TIME) {
        Work.onOneUnit()
        _u ++
    }

    // 任务干完, 执行回调
    if (_u >= Work.unit) {
        onDone()
        return
    }
    // 任务没完成, 继续等空闲执行
    window.requestIdleCallback(cb)
}
window.requestIdleCallback(cb)
```

## 3. Next
感想:
- window.requestIdleCallback 虽然还在实验阶段, 无法投入到production。
- 但作为低优的任务调度能力，对用户体验的提升有很大帮助。
- 未来可继续跟进该实验成果。

疑问:
- **React 具体怎么做到的任务调度?**

## 4. 性能截图
丢帧情况
![同步](https://user-images.githubusercontent.com/13708045/94146066-fdd6e780-fea5-11ea-8f1e-54d378c49f74.jpg)
![低优空闲处理](https://user-images.githubusercontent.com/13708045/94146071-ffa0ab00-fea5-11ea-80ab-3627e026e241.jpg)

