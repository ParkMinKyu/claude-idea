package com.example.petcare.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.petcare.data.Pet
import com.example.petcare.data.PetRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class PetViewModel @Inject constructor(
    private val repository: PetRepository
) : ViewModel() {

    val pets: StateFlow<List<Pet>> = repository.observePets()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun addPet(name: String, species: String) {
        viewModelScope.launch { repository.addPet(name, species) }
    }

    fun addDiary(petId: Long, note: String, walkMin: Int? = null) {
        val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        viewModelScope.launch { repository.addDiary(petId, date, note, walkMin) }
    }
}
