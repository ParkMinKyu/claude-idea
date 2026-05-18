package com.example.waterreminder.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun HydrationScreen(viewModel: HydrationViewModel) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("오늘의 수분 섭취", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(8.dp))
        Text("${state.totalMl}ml / ${state.goalMl}ml")
        LinearProgressIndicator(progress = { state.progress }, modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp))
        Row {
            Button(onClick = { viewModel.addCup(200, "컵") }) { Text("+200ml") }
            Spacer(Modifier.width(8.dp))
            Button(onClick = { viewModel.addCup(500, "텀블러") }) { Text("+500ml") }
        }
    }
}
