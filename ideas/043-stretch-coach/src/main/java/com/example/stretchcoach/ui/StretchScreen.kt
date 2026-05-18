package com.example.stretchcoach.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun StretchScreen(viewModel: StretchViewModel) {
    val todayCount by viewModel.todayCount.collectAsStateWithLifecycle()
    val exercises = remember { viewModel.exercises() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("오늘 ${todayCount}회", style = MaterialTheme.typography.headlineSmall)
        LazyColumn {
            items(exercises, key = { it.id }) { ex ->
                Card(Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Row(Modifier.padding(12.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text(ex.name)
                            Text("${ex.bodyPart} · ${ex.durationSec}초")
                        }
                        Button(onClick = { viewModel.complete(ex.id) }) { Text("완료") }
                    }
                }
            }
        }
    }
}
