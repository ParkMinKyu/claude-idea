package com.example.periodtracker.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.periodtracker.data.CycleEntry
import com.example.periodtracker.data.CycleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class CycleViewModel @Inject constructor(
    private val repository: CycleRepository
) : ViewModel() {

    val entries: StateFlow<List<CycleEntry>> = repository.observeEntries()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _prediction = MutableStateFlow<LocalDate?>(null)
    val prediction: StateFlow<LocalDate?> = _prediction.asStateFlow()

    fun logToday(flow: Int = 2) {
        viewModelScope.launch {
            repository.logStart(LocalDate.now(), flow)
            refreshPrediction()
        }
    }

    fun refreshPrediction() {
        viewModelScope.launch { _prediction.value = repository.predictNextStart() }
    }
}
