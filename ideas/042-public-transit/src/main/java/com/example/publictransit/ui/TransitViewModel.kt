package com.example.publictransit.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.publictransit.data.ArrivalDto
import com.example.publictransit.data.FavoriteStop
import com.example.publictransit.data.TransitRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TransitViewModel @Inject constructor(
    private val repository: TransitRepository
) : ViewModel() {

    val favorites: StateFlow<List<FavoriteStop>> = repository.observeFavorites()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _arrivals = MutableStateFlow<Map<String, List<ArrivalDto>>>(emptyMap())
    val arrivals: StateFlow<Map<String, List<ArrivalDto>>> = _arrivals.asStateFlow()

    fun loadArrivals(stopId: String) {
        viewModelScope.launch {
            runCatching { repository.arrivals(stopId) }
                .onSuccess { _arrivals.value = _arrivals.value + (stopId to it) }
        }
    }

    fun addFavorite(stopId: String, name: String, type: String, routes: List<String>) {
        viewModelScope.launch { repository.favorite(stopId, name, type, routes) }
    }

    fun eta(seconds: Int): String = repository.formatEta(seconds)
}
