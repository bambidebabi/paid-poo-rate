let hourlyRate = 0;
let timerInterval = null;
let isTimerRunning = false;
let startTime = 0;
let elapsedTime = 0;
let currentMode = 'totalHours'; // 记录当前模式

// --- 核心计时功能 ---

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function updateTimerAndEarning() {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    
    // 收入 = (时薪 / 3600 秒) * 经过的秒数
    const earning = (hourlyRate / 3600) * elapsedTime;

    document.getElementById('elapsedTime').textContent = formatTime(elapsedTime);
    document.getElementById('realtimeEarning').textContent = earning.toFixed(2);
}

function startTimer() {
    if (hourlyRate <= 0) {
        alert('请先计算一个有效的时薪！');
        return;
    }
    if (isTimerRunning) return;

    isTimerRunning = true;
    // 确保从上次停止的时间点继续计时
    startTime = Date.now() - (elapsedTime * 1000); 
    
    document.getElementById('timerToggleButton').textContent = '停止计时';
    // 切换按钮样式到 primary (更醒目)
    document.getElementById('timerToggleButton').classList.remove('secondary');
    document.getElementById('timerToggleButton').classList.add('primary'); 

    updateTimerAndEarning(); 
    timerInterval = setInterval(updateTimerAndEarning, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    
    document.getElementById('timerToggleButton').textContent = '继续计时';
    // 切换按钮样式到 secondary
    document.getElementById('timerToggleButton').classList.remove('primary');
    document.getElementById('timerToggleButton').classList.add('secondary');
}

// --- 按天计算总工时函数 ---
function calculateTotalHoursByDay() {
    const workDays = parseFloat(document.getElementById('workDays').value) || 0;
    const startTimeStr = document.getElementById('startTime').value; // e.g., "09:00"
    const endTimeStr = document.getElementById('endTime').value;   // e.g., "18:00"
    const overtime = parseFloat(document.getElementById('overtime').value) || 0;

    if (workDays <= 0) {
        document.getElementById('estimatedHours').textContent = '0';
        return 0;
    }

    // 解析时间字符串为小时
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);

    // 将时间转换为分钟数
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;

    // 处理跨夜情况 (如果结束时间小于开始时间，则加上 24 小时)
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }

    // 计算每日工作净分钟数
    const dailyNetMinutes = endMinutes - startMinutes;
    const dailyNetHours = dailyNetMinutes / 60;
    
    // 总工时 = (每日净小时 + 每日加班小时) * 工作天数
    const totalHours = (dailyNetHours + overtime) * workDays;
    
    // 更新预估显示
    document.getElementById('estimatedHours').textContent = totalHours.toFixed(2);

    return totalHours;
}

// --- 模式切换函数 ---
function switchMode(newMode) {
    currentMode = newMode;
    
    // 切换按钮激活状态
    document.getElementById('modeTotalHours').classList.remove('active');
    document.getElementById('modeByDay').classList.remove('active');
    document.getElementById('hoursMode').classList.remove('active-mode', 'hidden-mode');
    document.getElementById('dayMode').classList.remove('active-mode', 'hidden-mode');

    if (newMode === 'totalHours') {
        document.getElementById('modeTotalHours').classList.add('active');
        document.getElementById('hoursMode').classList.add('active-mode');
        document.getElementById('dayMode').classList.add('hidden-mode');
    } else {
        document.getElementById('modeByDay').classList.add('active');
        document.getElementById('dayMode').classList.add('active-mode');
        document.getElementById('hoursMode').classList.add('hidden-mode');
        // 切换到按天模式时，立即计算一次预估工时
        calculateTotalHoursByDay();
    }
}


// --- 事件监听器设置 ---
document.addEventListener('DOMContentLoaded', () => {
    // 模式切换按钮监听器
    document.getElementById('modeTotalHours').addEventListener('click', () => switchMode('totalHours'));
    document.getElementById('modeByDay').addEventListener('click', () => switchMode('byDay'));

    // 按天模式下输入框变化时，实时更新预估工时
    document.querySelectorAll('#dayMode input').forEach(input => {
        // 只有在非 time 类型的输入框变化时才触发，避免 time input 弹出原生选择器时触发 input 事件
        if (input.type !== 'time') {
            input.addEventListener('input', calculateTotalHoursByDay);
        }
        // time input 的 change 事件更合适
        if (input.type === 'time') {
            input.addEventListener('change', calculateTotalHoursByDay);
        }
    });
    
    // 计时按钮监听器
    document.getElementById('timerToggleButton').addEventListener('click', function() {
        if (isTimerRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    });

    // 计算按钮监听器
    document.getElementById('calculateButton').addEventListener('click', function() {
        const income = parseFloat(document.getElementById('totalIncome').value) || 0;
        const rateDisplay = document.getElementById('hourlyRate');
        const timerButton = document.getElementById('timerToggleButton');
        let hours = 0;

        // 根据当前模式获取总工时
        if (currentMode === 'totalHours') {
            hours = parseFloat(document.getElementById('totalHours').value) || 0;
        } else {
            hours = calculateTotalHoursByDay(); // 调用按天计算函数
        }

        if (hours > 0) {
            hourlyRate = income / hours;
            rateDisplay.textContent = hourlyRate.toFixed(2);
            timerButton.disabled = false;
            
            if (isTimerRunning) stopTimer();
            elapsedTime = 0;
            document.getElementById('elapsedTime').textContent = '00:00:00';
            document.getElementById('realtimeEarning').textContent = '0.00';
            document.getElementById('timerToggleButton').textContent = '开始计时'; 
        } else {
            rateDisplay.textContent = '0.00';
            hourlyRate = 0;
            timerButton.disabled = true;
            if (isTimerRunning) stopTimer();
            alert('总工时必须大于 0！');
        }
    });

    // 重置按钮监听器
    document.getElementById('resetButton').addEventListener('click', function() {
        document.getElementById('totalIncome').value = '0';
        document.getElementById('totalHours').value = '0';
        document.getElementById('hourlyRate').textContent = '0.00';
        document.getElementById('timerToggleButton').disabled = true;
        
        if (isTimerRunning) stopTimer();
        hourlyRate = 0;
        elapsedTime = 0;
        document.getElementById('elapsedTime').textContent = '00:00:00';
        document.getElementById('realtimeEarning').textContent = '0.00';
        
        document.getElementById('timerToggleButton').textContent = '开始计时';
        document.getElementById('timerToggleButton').classList.remove('primary');
        document.getElementById('timerToggleButton').classList.add('secondary');

        // 确保按天计算的预估小时数也被重置
        document.getElementById('estimatedHours').textContent = '0';
    });

    // 初始化时设置默认模式
    switchMode('totalHours');
});