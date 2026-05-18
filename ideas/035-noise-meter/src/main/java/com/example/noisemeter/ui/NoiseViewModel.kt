package com.example.noisemeter.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.noisemeter.data.NoiseRepository
import com.example.noisemeter.data.NoiseSample
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NoiseViewModel @Inject constructor(
    private val repository: NoiseRepository
) : ViewModel() {

    val recent: StateFlow<List<NoiseSample>> = repository.observeRecent()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _currentDb = MutableStateFlow(0.0)
    val currentDb: StateFlow<Double> = _currentDb.asStateFlow()

    fun onSamples(pcm: ShortArray) {
        val db = repository.pcmToDb(pcm)
        _currentDb.value = db
    }

    fun save(lat: Double? = null, lng: Double? = null) {
        viewModelScope.launch { repository.save(_currentDb.value, lat, lng) }
    }
}
