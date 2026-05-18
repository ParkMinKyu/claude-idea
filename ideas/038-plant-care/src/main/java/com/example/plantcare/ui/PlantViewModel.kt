package com.example.plantcare.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.plantcare.data.Plant
import com.example.plantcare.data.PlantRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PlantViewModel @Inject constructor(
    private val repository: PlantRepository
) : ViewModel() {

    val plants: StateFlow<List<Plant>> = repository.observePlants()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun addPlant(name: String, species: String, interval: Int) {
        if (name.isBlank()) return
        viewModelScope.launch { repository.addPlant(name.trim(), species, interval) }
    }

    fun water(id: Long) { viewModelScope.launch { repository.water(id) } }

    fun daysUntil(plant: Plant): Int = repository.daysUntilWatering(plant)
}
