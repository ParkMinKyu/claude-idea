package com.example.waterreminder

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import dagger.hilt.android.AndroidEntryPoint
import com.example.waterreminder.ui.HydrationScreen
import com.example.waterreminder.ui.HydrationViewModel

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val viewModel: HydrationViewModel by viewModels()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface { HydrationScreen(viewModel) }
            }
        }
    }
}
