package com.example.pomodorofocus.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun FocusScreen(viewModel: FocusViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    Column(Modifier.fillMaxSize().padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally) {
        Text("FocusLock", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(48.dp))
        val mm = state.remainingSec / 60
        val ss = state.remainingSec % 60
        Text("%02d:%02d".format(mm, ss), style = MaterialTheme.typography.displayLarge)
        Spacer(Modifier.height(24.dp))
        LinearProgressIndicator(progress = { state.progress }, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(24.dp))
        if (state.isRunning) {
            Button(onClick = { viewModel.cancel() }) { Text("취소") }
        } else {
            Button(onClick = { viewModel.start(25) }) { Text("25분 시작") }
        }
    }
}
