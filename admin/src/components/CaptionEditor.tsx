// 이미지 캡션 에디터 컴포넌트
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Button, Space, Modal, Input, List, Avatar, message } from 'antd';
import { BoldOutlined, ItalicOutlined, UnderlineOutlined, LinkOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useWorks } from '../hooks/useWorks';
import type { Work } from '../types';
import './CaptionEditor.css';

interface CaptionEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  imageIndex?: number;
  imageId?: string;
}

const CaptionEditor = ({ value = '', onChange }: CaptionEditorProps) => {
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkSearchText, setLinkSearchText] = useState('');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  // Firebase에서 작업 목록 조회
  const { data: works = [] } = useWorks();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'caption-link',
        },
      }),
      Underline,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'caption-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const textLength = editor.state.doc.textContent.length;
      
      // 1000자 제한
      if (textLength > 1000) {
        message.warning('캡션은 최대 1000자까지 입력 가능합니다.');
        return;
      }
      
      onChange?.(html);
    },
  });

  // value가 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Bold 토글
  const handleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  // Italic 토글
  const handleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  // Underline 토글
  const handleUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

  // 작업 링크 삽입 모달 열기
  const handleInsertLink = () => {
    if (!editor) return;
    
    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);
    
    if (!selectedText.trim()) {
      message.warning('링크를 삽입할 텍스트를 먼저 선택해주세요.');
      return;
    }

    setLinkModalVisible(true);
  };

  // 작업 링크 삽입
  const handleConfirmLink = () => {
    if (!selectedWorkId || !editor) {
      message.warning('작업을 선택해주세요.');
      return;
    }

    const selection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(selection.from, selection.to);
    const selectedWork = works.find((w) => w.id === selectedWorkId);

    if (selectedWork && selectedText.trim()) {
      // 선택된 텍스트가 있는 경우에만 링크 적용
      const { from, to } = selection;
      
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setLink({
          href: `/works/${selectedWorkId}`,
          target: '_blank',
        })
        .run();

      // HTML을 가져와서 data 속성 추가
      setTimeout(() => {
        let html = editor.getHTML();
        // 링크에 data 속성 추가
        const escapedTitle = selectedWork.title.replace(/"/g, '&quot;');
        html = html.replace(
          new RegExp(`<a([^>]*href="/works/${selectedWorkId}"[^>]*)>`, 'g'),
          `<a$1 data-work-id="${selectedWorkId}" data-work-title="${escapedTitle}">`
        );
        onChange?.(html);
      }, 0);

      message.success(`"${selectedWork.title}" 작업 링크가 삽입되었습니다.`);
      setLinkModalVisible(false);
      setLinkSearchText('');
      setSelectedWorkId(null);
    }
  };

  // 작업 검색 결과 필터링
  const filteredWorks = works.filter((work) =>
    work.title.toLowerCase().includes(linkSearchText.toLowerCase()) ||
    work.shortDescription?.toLowerCase().includes(linkSearchText.toLowerCase())
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="caption-editor">
      {/* 툴바 */}
      <div className="caption-toolbar">
        <Space size="small">
          <Button
            type={editor.isActive('bold') ? 'primary' : 'default'}
            size="small"
            icon={<BoldOutlined />}
            onClick={handleBold}
            title="진하게 (Ctrl+B)"
          />
          <Button
            type={editor.isActive('italic') ? 'primary' : 'default'}
            size="small"
            icon={<ItalicOutlined />}
            onClick={handleItalic}
            title="기울임 (Ctrl+I)"
          />
          <Button
            type={editor.isActive('underline') ? 'primary' : 'default'}
            size="small"
            icon={<UnderlineOutlined />}
            onClick={handleUnderline}
            title="밑줄 (Ctrl+U)"
          />
          <Button
            size="small"
            icon={<LinkOutlined />}
            onClick={handleInsertLink}
            title="작업 링크 삽입"
          >
            작업 링크
          </Button>
        </Space>
      </div>

      {/* 에디터 영역 */}
      <div className="caption-editor-wrapper">
        <EditorContent editor={editor} />
      </div>

      {/* 글자 수 표시 */}
      <div className="caption-char-count" style={{
        color: editor.state.doc.textContent.length > 1000 ? '#ff4d4f' : '#8c8c8c'
      }}>
        {editor.state.doc.textContent.length} / 1000자
      </div>

      {/* 작업 링크 삽입 모달 */}
      <Modal
        title="작업 링크 삽입"
        open={linkModalVisible}
        onOk={handleConfirmLink}
        onCancel={() => {
          setLinkModalVisible(false);
          setLinkSearchText('');
          setSelectedWorkId(null);
        }}
        okText="삽입"
        cancelText="취소"
        width={600}
      >
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="작업 검색..."
            value={linkSearchText}
            onChange={(e) => setLinkSearchText(e.target.value)}
            allowClear
            style={{ marginBottom: '16px' }}
          />
          <List
            dataSource={filteredWorks.slice(0, 10)}
            renderItem={(work: Work) => {
              const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId);
              const isSelected = selectedWorkId === work.id;
              return (
                <List.Item
                  onClick={() => setSelectedWorkId(work.id)}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? '#e6f7ff' : 'transparent',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        shape="square"
                        size={48}
                        src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url}
                      />
                    }
                    title={work.title}
                    description={work.shortDescription || work.fullDescription.substring(0, 50) + '...'}
                  />
                </List.Item>
              );
            }}
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          />
          {filteredWorks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#8c8c8c' }}>
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CaptionEditor;

