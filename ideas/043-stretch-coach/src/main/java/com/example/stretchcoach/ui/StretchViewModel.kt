package com.example.stretchcoach.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.stretchcoach.data.StretchExercise
import com.example.stretchcoach.data.StretchRepository
import com.example.stretchcoach.data.StretchSession
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StretchViewModel @Inject constructor(
    private val repository: StretchRepository
) : ViewModel() {

    val recent: StateFlow<List<StretchSession>> = repository.observeRecent()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _todayCount = MutableStateFlow(0)
    val todayCount: StateFlow<Int> = _todayCount.asStateFlow()

    private val _isPremium = MutableStateFlow(false)

    fun exercises(part: String? = null): List<StretchExercise> =
        repository.exercisesFor(part, includePremium = _isPremium.value)

    fun complete(exerciseId: String) {
        viewModelScope.launch {
            repository.recordSession(exerciseId)
            _todayCount.value = repository.todayCount()
        }
    }

    fun setPremium(value: Boolean) { _isPremium.value = value }
}
