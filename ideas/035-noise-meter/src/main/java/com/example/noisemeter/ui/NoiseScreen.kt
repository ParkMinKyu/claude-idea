package com.example.noisemeter.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun NoiseScreen(viewModel: NoiseViewModel) {
    val db by viewModel.currentDb.collectAsStateWithLifecycle()
    val samples by viewModel.recent.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("실시간 소음", style = MaterialTheme.typography.headlineMedium)
        Text("${"%.1f".format(db)} dB", style = MaterialTheme.typography.displayLarge)
        Button(onClick = { viewModel.save() }) { Text("기록 저장") }
        Spacer(Modifier.height(16.dp))
        Text("최근 기록: ${samples.size}건")
    }
}
