package com.example.receiptscanner.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.receiptscanner.data.Receipt
import com.example.receiptscanner.data.ReceiptRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReceiptViewModel @Inject constructor(
    private val repository: ReceiptRepository
) : ViewModel() {

    val receipts: StateFlow<List<Receipt>> = repository.observeReceipts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _searchResults = MutableStateFlow<List<Receipt>>(emptyList())
    val searchResults: StateFlow<List<Receipt>> = _searchResults.asStateFlow()

    fun onScanned(rawText: String, imagePath: String) {
        viewModelScope.launch { repository.saveFromOcr(rawText, imagePath) }
    }

    fun search(query: String) {
        viewModelScope.launch { _searchResults.value = repository.search(query) }
    }
}
