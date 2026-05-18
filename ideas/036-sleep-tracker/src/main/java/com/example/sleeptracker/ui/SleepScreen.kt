package com.example.sleeptracker.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun SleepScreen(viewModel: SleepViewModel) {
    val sessions by viewModel.sessions.collectAsStateWithLifecycle()
    val tracking by viewModel.tracking.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("수면 트래킹", style = MaterialTheme.typography.headlineMedium)
        Button(onClick = { if (tracking) viewModel.stopTracking() else viewModel.startTracking() }) {
            Text(if (tracking) "정지" else "시작")
        }
        Spacer(Modifier.height(16.dp))
        LazyColumn {
            items(sessions, key = { it.id }) { s ->
                ListItem(headlineContent = { Text("점수: ${s.score}") },
                    supportingContent = { Text("깊은수면 ${s.deepMinutes}분, REM ${s.remMinutes}분") })
            }
        }
    }
}
