package com.example.waterreminder.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.waterreminder.data.HydrationRepository
import com.example.waterreminder.data.WaterIntake
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HydrationUiState(
    val intakes: List<WaterIntake> = emptyList(),
    val totalMl: Int = 0,
    val goalMl: Int = 2000
) {
    val progress: Float get() = (totalMl.toFloat() / goalMl).coerceIn(0f, 1f)
}

@HiltViewModel
class HydrationViewModel @Inject constructor(
    private val repository: HydrationRepository
) : ViewModel() {

    private val goal = MutableStateFlow(2000)

    val uiState: StateFlow<HydrationUiState> =
        combine(repository.observeToday(), goal) { intakes, g ->
            HydrationUiState(
                intakes = intakes,
                totalMl = intakes.sumOf { it.amountMl },
                goalMl = g
            )
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HydrationUiState())

    fun addCup(amount: Int, container: String = "컵") {
        viewModelScope.launch { repository.addIntake(amount, container) }
    }

    fun updateGoal(weightKg: Int, activityLevel: Int) {
        goal.value = repository.calculateDailyGoal(weightKg, activityLevel)
    }
}
