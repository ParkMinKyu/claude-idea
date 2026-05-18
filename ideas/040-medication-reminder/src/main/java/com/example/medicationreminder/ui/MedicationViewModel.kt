package com.example.medicationreminder.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medicationreminder.data.Medication
import com.example.medicationreminder.data.MedicationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MedicationViewModel @Inject constructor(
    private val repository: MedicationRepository
) : ViewModel() {

    val meds: StateFlow<List<Medication>> = repository.observeMeds()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _lowStock = MutableStateFlow<List<Medication>>(emptyList())
    val lowStock: StateFlow<List<Medication>> = _lowStock.asStateFlow()

    fun add(name: String, dose: Double, timesPerDay: Int, stock: Int) {
        if (name.isBlank()) return
        viewModelScope.launch {
            repository.addMedication(name.trim(), dose, timesPerDay, stock)
            refreshLowStock()
        }
    }

    fun take(medId: Long) {
        viewModelScope.launch {
            repository.recordIntake(medId)
            refreshLowStock()
        }
    }

    fun refreshLowStock() {
        viewModelScope.launch { _lowStock.value = repository.lowStockMedications() }
    }
}
