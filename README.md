# RequestIdleCallback 实验

**DEMO: https://linjiayu6.github.io/FE-RequestIdleCallback-demo/**

```
前言: 
- React 16 实现了基于Fiber的调度算法, 和requestIdleCallback 的实现大同小异。
- 为什么 React要自己实现一套调度能力呢? 该API兼容性并不好。
- 这里我们先来实验 requestIdleCallback 对性能 和 用户体验的 影响。
```

<hr/>


**为什么出现页面会卡顿?**
- JS 是单线程, 浏览器是多线程。除了JS线程外，还有UI渲染线程， HTTP请求线程等。
- 因为JS是可以操作DOM，故JS和UI线程是互斥的。每当JS线程执行，UI线程会被挂起，等待JS执行完成后，再继续。因此用户会感知到页面卡顿情况。

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

## 4. 性能 (丢帧情况)
>  https://medium.com/@paul_irish/requestanimationframe-scheduling-for-nerds-9c57f7438ef4
### 4.1 同步
- 从图上可以清晰看到点击按钮A，B,  C  响应如图。
- 在点击按钮A后，同步处理A事件，等到A处理完后，响应B事件 .....
- 但能看到此时lottie动画，丢帧严重，用户看到的是动画卡顿。
![同步](https://user-images.githubusercontent.com/13708045/94146066-fdd6e780-fea5-11ea-8f1e-54d378c49f74.jpg)
### 4.2 requestIdleCallback 低优处理策略
- 点击按钮A, B, C 后，并未同步处理按钮回调事情。
- 按照 a frame 生命周期来说，处理完动画后，才会去根据浏览器空闲情况，来执行分片的事件。
- 用户看到的动画不会卡顿。
- 因为处理事件放到requestIdleCallback，默认为优先级低，并分片处理，故处理时长会比同步长很多。
![低优空闲处理](https://user-images.githubusercontent.com/13708045/94146071-ffa0ab00-fea5-11ea-80ab-3627e026e241.jpg)

## 5. 问题
- requestIdleCallback 是利用帧之间空闲时间来执行JS.
- 😈 **requestIdleCallback 是在 layout 和 paint 之后, 意味着requestIdleCallback 是可以js计算并改变DOM的，也就是说会 触发重新 layout 和 paint**
- **requestAnimationFrame 是在 layout 和 paint 之前，因此更适合变更DOM操作**。
- 因此React内部对调度策略的实现也是基于requestAnimationFrame的。

## 6. R
- https://que01.top/2019/08/28/v16-Scheduling-in-React/
- https://zhuanlan.zhihu.com/p/60307571
