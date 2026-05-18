package com.example.budgettracker.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.budgettracker.data.BudgetRepository
import com.example.budgettracker.data.CategoryTotal
import com.example.budgettracker.data.Transaction
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BudgetViewModel @Inject constructor(
    private val repository: BudgetRepository
) : ViewModel() {

    val transactions: StateFlow<List<Transaction>> = repository.observeTransactions()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _summary = MutableStateFlow<List<CategoryTotal>>(emptyList())
    val summary: StateFlow<List<CategoryTotal>> = _summary.asStateFlow()

    fun addManual(amount: Long, merchant: String, category: String) {
        viewModelScope.launch {
            repository.addManual(amount, merchant, category)
            refreshSummary()
        }
    }

    fun refreshSummary() {
        viewModelScope.launch { _summary.value = repository.monthlySummary() }
    }
}
