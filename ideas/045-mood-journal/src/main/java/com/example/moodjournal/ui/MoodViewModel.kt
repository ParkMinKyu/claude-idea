package com.example.moodjournal.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.moodjournal.data.MoodEntry
import com.example.moodjournal.data.MoodRepository
import com.example.moodjournal.data.TagStat
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MoodViewModel @Inject constructor(
    private val repository: MoodRepository
) : ViewModel() {

    val entries: StateFlow<List<MoodEntry>> = repository.observeEntries()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    private val _avg = MutableStateFlow(0.0)
    val avg: StateFlow<Double> = _avg.asStateFlow()

    private val _topTags = MutableStateFlow<List<TagStat>>(emptyList())
    val topTags: StateFlow<List<TagStat>> = _topTags.asStateFlow()

    fun checkIn(score: Int, tags: List<String>, note: String) {
        viewModelScope.launch {
            repository.checkIn(score, tags, note)
            refresh()
        }
    }

    fun refresh() {
        viewModelScope.launch {
            _avg.value = repository.average7Day()
            _topTags.value = repository.topTags()
        }
    }
}
