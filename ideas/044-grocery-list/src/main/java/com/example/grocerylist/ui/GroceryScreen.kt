package com.example.grocerylist.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun GroceryScreen(viewModel: GroceryViewModel) {
    val items by viewModel.items.collectAsStateWithLifecycle()
    var input by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("장보기 리스트", style = MaterialTheme.typography.headlineMedium)
        Row {
            OutlinedTextField(value = input, onValueChange = { input = it },
                label = { Text("말로 입력") }, modifier = Modifier.weight(1f))
            Button(onClick = { viewModel.addByVoice(input); input = "" }) { Text("추가") }
        }
        TextButton(onClick = { viewModel.clearChecked() }) { Text("체크된 항목 삭제") }
        LazyColumn {
            items(items, key = { it.id }) { item ->
                Row(Modifier.fillMaxWidth().padding(8.dp)) {
                    Checkbox(checked = item.checked, onCheckedChange = { viewModel.toggle(item) })
                    Text("${item.name} (${item.category}) x${item.quantity}",
                        textDecoration = if (item.checked) TextDecoration.LineThrough else null)
                }
            }
        }
    }
}
