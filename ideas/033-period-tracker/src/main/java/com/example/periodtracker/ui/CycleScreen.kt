package com.example.periodtracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun CycleScreen(viewModel: CycleViewModel) {
    val entries by viewModel.entries.collectAsStateWithLifecycle()
    val prediction by viewModel.prediction.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.refreshPrediction() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("주기 기록", style = MaterialTheme.typography.headlineMedium)
        prediction?.let { Text("다음 예상 시작: $it") }
        Spacer(Modifier.height(8.dp))
        Button(onClick = { viewModel.logToday() }) { Text("오늘 시작 기록") }
        Spacer(Modifier.height(16.dp))
        LazyColumn {
            items(entries, key = { it.id }) { entry ->
                ListItem(headlineContent = { Text(entry.startDate) },
                    supportingContent = { Text("강도: ${entry.flowIntensity}") })
            }
        }
    }
}
