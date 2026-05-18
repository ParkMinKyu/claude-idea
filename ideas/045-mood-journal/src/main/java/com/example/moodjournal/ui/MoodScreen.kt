package com.example.moodjournal.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun MoodScreen(viewModel: MoodViewModel) {
    val avg by viewModel.avg.collectAsStateWithLifecycle()
    val tags by viewModel.topTags.collectAsStateWithLifecycle()
    var note by remember { mutableStateOf("") }
    var score by remember { mutableStateOf(3) }

    LaunchedEffect(Unit) { viewModel.refresh() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("감정 일기", style = MaterialTheme.typography.headlineMedium)
        Text("7일 평균: ${"%.1f".format(avg)}")
        Text("자주 쓴 태그: ${tags.joinToString { "${it.tag}(${it.count})" }}")
        Spacer(Modifier.height(8.dp))
        Row { (1..5).forEach { i ->
            Button(onClick = { score = i }, enabled = i != score,
                modifier = Modifier.padding(2.dp)) { Text("$i") }
        } }
        OutlinedTextField(value = note, onValueChange = { note = it },
            label = { Text("오늘 한마디") }, modifier = Modifier.fillMaxWidth())
        Button(onClick = {
            viewModel.checkIn(score, listOf("기본"), note)
            note = ""
        }) { Text("기록") }
    }
}
