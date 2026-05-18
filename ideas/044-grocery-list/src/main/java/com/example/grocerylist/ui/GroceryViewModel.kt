package com.example.grocerylist.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.grocerylist.data.GroceryItem
import com.example.grocerylist.data.GroceryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class GroceryViewModel @Inject constructor(
    private val repository: GroceryRepository
) : ViewModel() {

    val items: StateFlow<List<GroceryItem>> = repository.observeItems()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun addByVoice(transcript: String) {
        viewModelScope.launch { repository.addFromVoice(transcript) }
    }

    fun toggle(item: GroceryItem) {
        viewModelScope.launch { repository.toggle(item) }
    }

    fun clearChecked() {
        viewModelScope.launch { repository.clearChecked() }
    }
}
