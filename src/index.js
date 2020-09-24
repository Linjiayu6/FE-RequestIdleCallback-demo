// 同步任务
let SYNC = true

if ('requestIdleCallback' in window) {
    console.log('# support `requestIdleCallback`');
    START();
} else {
    console.log('# Your browser does not support `requestIdleCallback`, please try latest Chrome.');
}

/**
 * 我们约定点击Button事件相较于页面渲染是低优先级
 * 操作: 通过Button的点击切换内容
 */
function START () {
    const element = id => document.querySelector('#' + id)

    const _cbTextDOM = element('cbText')

    const bindClick = id => element(id).addEventListener('click', executeTask)
    const bindChange = id => element(id).addEventListener('change', e => {
        SYNC = e.target.checked
        _cbTextDOM.innerHTML = SYNC ? 'Sync 同步阻塞, 动画卡顿' : 'Async requestIdleCallback, 动画不会卡顿'
    })

    // 绑定click事件
    bindClick('btnA')
    bindClick('btnB')
    bindClick('btnC')

    // 切换
    bindChange('toggle')
}

function executeTask(e) {
    const from = e.target.id
    // 同步任务
    let text = '#同步阻塞#' + from
    if (SYNC) {
        console.time(text)
        task('sync')
        console.timeEnd(text)
        return
    }

    // 异步任务
    text = '#异步空闲执行#' + from
    console.time(text)
    task('async', () => console.timeEnd(text))
}

function task (key, onDone = () => {}) {
    var Work = {
        // 有1万个任务
        unit: 10000,
        // 处理每个任务
        onOneUnit: function () {  for (var i = 0; i <= 500000; i++) {} },
        // 同步处理: 一次处理完所有任务
        onSyncUnit: function () {
            let _u = 0
            while (_u < Work.unit) {
                Work.onOneUnit()
                _u ++
            }
        },
        // 异步处理
        onAsyncUnit: function () {
            // 空闲时间 1ms
            const FREE_TIME = 1
            let _u = 0

            function cb(deadline) {
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
        }
    }

    if (key === 'sync') {
        Work.onSyncUnit()
    } else {
        Work.onAsyncUnit()
    }
}

