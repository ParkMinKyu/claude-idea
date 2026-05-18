package com.example.pomodorofocus.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.pomodorofocus.data.FocusRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TimerState(
    val totalSec: Int = 25 * 60,
    val remainingSec: Int = 25 * 60,
    val isRunning: Boolean = false
) {
    val progress: Float get() = 1f - (remainingSec.toFloat() / totalSec)
}

@HiltViewModel
class FocusViewModel @Inject constructor(
    private val repository: FocusRepository
) : ViewModel() {

    private val _state = MutableStateFlow(TimerState())
    val state: StateFlow<TimerState> = _state.asStateFlow()

    private var tickJob: Job? = null

    fun start(minutes: Int = 25) {
        tickJob?.cancel()
        _state.value = TimerState(totalSec = minutes * 60,
            remainingSec = minutes * 60, isRunning = true)
        tickJob = viewModelScope.launch {
            while (_state.value.remainingSec > 0 && _state.value.isRunning) {
                delay(1_000)
                _state.value = _state.value.copy(remainingSec = _state.value.remainingSec - 1)
            }
            if (_state.value.remainingSec == 0) {
                repository.completeSession(minutes)
                _state.value = _state.value.copy(isRunning = false)
            }
        }
    }

    fun cancel() {
        val elapsedSec = _state.value.totalSec - _state.value.remainingSec
        tickJob?.cancel()
        viewModelScope.launch {
            if (elapsedSec >= 60) repository.cancelSession(elapsedSec / 60)
            _state.value = TimerState()
        }
    }
}
