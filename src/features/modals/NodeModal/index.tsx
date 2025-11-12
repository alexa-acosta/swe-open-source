import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

type SimpleRow = { key: string; value: string };

const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") { 
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const updateJsonValue = useJson(state => state.updateJsonValue);

  const initialContent = normalizeNodeData(nodeData?.text ?? []);
  const initialRows: SimpleRow[] = React.useMemo(() => 
    nodeData?.text
      ?.filter(row => 
          row.type !== "array" && row.type !== "object" && row.key 
      )
      .map(row => ({ key: row.key!, value: `${row.value}` })) || [] 
  , [nodeData]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedRows, setEditedRows] = useState<SimpleRow[]>(initialRows); 

  React.useEffect(() => {
    setEditedRows(initialRows); 
    setIsEditing(false); 
  }, [initialRows, opened]);

  const handleFieldChange = (key: string, newValue: string) => {
    setEditedRows(prev => prev.map(row => 
        row.key === key ? { ...row, value: newValue } : row
    ));
  };
  
  const handleSave = () => {
    if (!nodeData || !nodeData.path) return;

    editedRows.forEach(row => {
        const pathSegments = [...nodeData.path!, row.key]; 

        let parsedValue;
        try {
            parsedValue = JSON.parse(row.value);
        } catch (e) {
            parsedValue = row.value;
        }

        updateJsonValue(pathSegments, parsedValue); 
    });

    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setEditedRows(initialRows); 
    setIsEditing(false); 
    onClose(); 
  };
  
  const isEditable = initialRows.length > 0;

  return (
    <Modal size="auto" opened={opened} onClose={handleCancel} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            
            <Flex gap="sm" align="center">
              {isEditing ? (
                <>
                  <Button color="green" onClick={handleSave} size="xs">
                    Save
                  </Button>
                  <Button color="red" onClick={handleCancel} size="xs" variant="light">
                    Cancel
                  </Button>
                </>
              ) : (
                isEditable && (
                  <Button onClick={() => setIsEditing(true)} size="xs">
                    Edit
                  </Button>
                )
              )}  
              <CloseButton onClick={handleCancel} />
            </Flex>
          </Flex>
          <ScrollArea.Autosize mah={250} maw={600}>
            {isEditing ? (
              <Stack>
                {editedRows.map(row => (
                    <div key={row.key}>
                        <Text fz="xs" fw={500} style={{ paddingLeft: '4px' }}>{row.key}</Text>
                        <Textarea
                            value={row.value}
                            onChange={(e) => handleFieldChange(row.key, e.currentTarget.value)}
                            autosize
                            minRows={1}
                            styles={{ 
                                input: { 
                                    fontFamily: 'monospace', 
                                    fontSize: '13px', 
                                    backgroundColor: '#1A1A1A', 
                                    color: 'white',
                                } 
                            }}
                        />
                    </div>
                ))}
              </Stack>
            ) : (
              <CodeHighlight
                code={initialContent}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};