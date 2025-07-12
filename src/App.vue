<template>
  <div class="min-h-screen bg-secondary text-gray-800">
    <header class="bg-primary text-white p-4 text-center">
      <h1 class="text-2xl font-bold">朋友圈客户画像心理分析系统</h1>
    </header>

    <main class="container mx-auto p-4">
      <!-- 图片上传模块 -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-4">1. 上传朋友圈截图</h2>
        <el-upload
          v-model:file-list="fileList"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :on-preview="handlePictureCardPreview"
          :on-remove="handleRemove"
          :on-change="handleChange"
          multiple
          :limit="20"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <el-dialog v-model="dialogVisible">
          <img w-full :src="dialogImageUrl" alt="Preview Image" />
        </el-dialog>
        <div class="mt-4">
          <el-button type="primary" @click="submitUpload" :disabled="fileList.length < 5 || loading">开始分析</el-button>
          <p class="text-sm text-gray-500 mt-2">请上传 5-20 张朋友圈截图</p>
        </div>
      </section>

      <!-- 分析进度 -->
      <section v-if="loading" class="mb-8">
        <h2 class="text-xl font-semibold mb-4">2. AI 分析中</h2>
        <el-progress :percentage="progress" :text-inside="true" :stroke-width="20" status="success" />
        <p class="text-center mt-2">正在调用豆包大模型进行分析，请稍候...</p>
      </section>

      <!-- 报告展示模块 -->
      <section v-if="analysisResult">
        <h2 class="text-xl font-semibold mb-4">3. 客户画像报告</h2>
        <div class="bg-white p-6 rounded-lg shadow-md">
          <pre class="whitespace-pre-wrap">{{ analysisResult }}</pre>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage, ElUpload } from 'element-plus'
import type { UploadFile, UploadFiles, UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const fileList = ref<UploadUserFile[]>([])
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const loading = ref(false)
const progress = ref(0)
const analysisResult = ref<string | null>(null)

const handleRemove = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  console.log(uploadFile, uploadFiles)
}

const handlePictureCardPreview = (uploadFile: UploadFile) => {
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
}

const handleChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  fileList.value = uploadFiles
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const submitUpload = async () => {
  if (fileList.value.length < 5) {
    ElMessage.warning('请至少上传 5 张图片');
    return;
  }

  loading.value = true;
  progress.value = 0;
  analysisResult.value = null;

  try {
    const imageContents = await Promise.all(
      fileList.value.map(async (file) => {
        const base64 = await toBase64(file.raw as File);
        return { type: 'image_url', image_url: { url: base64 } };
      })
    );

    const response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      model: 'doubao-seed-1-6-thinking-250615',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: '请根据这些朋友圈截图，详细分析这个人的客户画像，包括：个人兴趣爱好、消费水平和偏好、生活方式和价值观、社交圈层次、工作状态和职业特征、家庭状况、性格特征、最近的情绪及精神状态、家庭角色和责任感、人际交往特征。并给出销售建议和策略，以及适合对方的3个不同风格的美甲方案。' },
            ...imageContents,
          ],
        },
      ],
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer a50a822b-edf0-4ad7-a7d8-233b67268665',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
            progress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
      }
    });

    if (response.data.choices && response.data.choices.length > 0) {
      analysisResult.value = response.data.choices[0].message.content;
    } else {
        throw new Error('未收到有效的分析结果');
    }

  } catch (error) {
    console.error('分析失败:', error);
    ElMessage.error('分析失败，请检查网络或联系管理员');
  } finally {
    loading.value = false;
  }
};
</script>

<style>
.container {
  max-width: 800px;
}
</style>